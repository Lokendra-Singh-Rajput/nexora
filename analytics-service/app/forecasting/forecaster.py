from datetime import datetime, timedelta
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing

def generate_sales_forecast(df_orders: pd.DataFrame, forecast_horizon_days: int = 30) -> Dict[str, Any]:
    """
    Computes time-series forecasting for daily revenue.
    Employs chronological train/test split, evaluates Naive, Moving Average, and Exponential Smoothing models.
    Produces 30-day forward projections with 95% confidence intervals and validation metrics.
    """
    if df_orders is None or df_orders.empty:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": "At least 30 days of historical sales records are required.",
            "historical": [],
            "forecast": [],
            "metrics": {"mae": 0.0, "rmse": 0.0, "mape": 0.0, "wape": 0.0, "model_used": "None"}
        }

    df_copy = df_orders.copy()
    df_copy["order_date"] = pd.to_datetime(df_copy["order_date"])
    
    # Aggregate daily revenue
    daily_ts = df_copy.groupby("order_date")["sales"].sum().asfreq("D", fill_value=0.0)
    
    if len(daily_ts) < 14:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": f"Historical series contains only {len(daily_ts)} days. Minimum 14 days required.",
            "historical": [],
            "forecast": [],
            "metrics": {"mae": 0.0, "rmse": 0.0, "mape": 0.0, "wape": 0.0, "model_used": "None"}
        }

    # Chronological Train/Test split: 80% train, 20% test
    split_idx = int(len(daily_ts) * 0.80)
    train_ts = daily_ts.iloc[:split_idx]
    test_ts = daily_ts.iloc[split_idx:]
    test_len = len(test_ts)

    # 1. Model A: Naive Forecast (last known value repeated)
    last_train_val = train_ts.iloc[-1]
    pred_naive = np.full(test_len, last_train_val)

    # 2. Model B: 7-Day Moving Average
    ma_val = train_ts.tail(7).mean()
    pred_ma = np.full(test_len, ma_val)

    # 3. Model C: Exponential Smoothing
    try:
        es_model = ExponentialSmoothing(
            train_ts + 1.0, # Avoid zero issues
            trend="add",
            seasonal="add",
            seasonal_periods=7,
            initialization_method="estimated"
        ).fit()
        pred_es = es_model.forecast(test_len) - 1.0
        pred_es = np.maximum(0.0, pred_es.values)
    except Exception:
        # Fallback to simple exponential smoothing
        try:
            es_model = ExponentialSmoothing(train_ts + 1.0, trend="add").fit()
            pred_es = np.maximum(0.0, es_model.forecast(test_len).values - 1.0)
        except Exception:
            pred_es = pred_ma

    # Evaluate models on test set
    y_true = test_ts.values
    def evaluate(y_pred, name):
        mae = float(np.mean(np.abs(y_true - y_pred)))
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        # WAPE is safer than MAPE when zeros occur
        total_actual = float(np.sum(y_true))
        wape = float(np.sum(np.abs(y_true - y_pred)) / total_actual * 100.0) if total_actual > 0 else 0.0
        non_zeros = y_true > 0
        mape = float(np.mean(np.abs((y_true[non_zeros] - y_pred[non_zeros]) / y_true[non_zeros])) * 100.0) if np.any(non_zeros) else 0.0
        return {"mae": mae, "rmse": rmse, "mape": mape, "wape": wape, "model": name}

    metrics_naive = evaluate(pred_naive, "Naive Baseline")
    metrics_ma = evaluate(pred_ma, "7-Day Moving Average")
    metrics_es = evaluate(pred_es, "Holt-Winters Exponential Smoothing")

    # Select best model based on lowest MAE
    all_models = [metrics_naive, metrics_ma, metrics_es]
    best_model_meta = min(all_models, key=lambda m: m["mae"])
    selected_name = best_model_meta["model"]

    # Now train on FULL dataset and forecast horizon
    full_series = daily_ts.values
    residual_std = 0.0

    if selected_name == "Holt-Winters Exponential Smoothing":
        try:
            final_fit = ExponentialSmoothing(
                daily_ts + 1.0,
                trend="add",
                seasonal="add",
                seasonal_periods=7,
                initialization_method="estimated"
            ).fit()
            forecast_vals = np.maximum(0.0, final_fit.forecast(forecast_horizon_days).values - 1.0)
            residuals = (daily_ts + 1.0).values - final_fit.fittedvalues.values
            residual_std = float(np.std(residuals))
        except Exception:
            final_fit = ExponentialSmoothing(daily_ts + 1.0, trend="add").fit()
            forecast_vals = np.maximum(0.0, final_fit.forecast(forecast_horizon_days).values - 1.0)
            residual_std = float(np.std(daily_ts.tail(14).values))
    elif selected_name == "7-Day Moving Average":
        base_val = daily_ts.tail(7).mean()
        forecast_vals = np.full(forecast_horizon_days, base_val)
        residual_std = float(np.std(daily_ts.tail(14).values))
    else:
        last_val = daily_ts.iloc[-1]
        forecast_vals = np.full(forecast_horizon_days, last_val)
        residual_std = float(np.std(daily_ts.tail(14).values))

    if residual_std == 0.0:
        residual_std = float(np.std(daily_ts.values)) if len(daily_ts) > 1 else 100.0

    # Build historical output (last 60 days for dashboard chart clarity)
    hist_chart = []
    recent_ts = daily_ts.tail(60)
    for dt, val in recent_ts.items():
        hist_chart.append({
            "date": dt.strftime("%Y-%m-%d"),
            "actual": round(float(val), 2),
            "forecast": None,
            "lower_bound": None,
            "upper_bound": None
        })

    # Build 30-day forecast points with 95% confidence interval
    last_date = daily_ts.index[-1]
    forecast_points = []
    for i in range(1, forecast_horizon_days + 1):
        f_date = (last_date + timedelta(days=i)).strftime("%Y-%m-%d")
        f_val = float(forecast_vals[i - 1])
        # Uncertainty widens slightly over horizon
        uncertainty = 1.96 * residual_std * np.sqrt(1.0 + (i / 15.0))
        lower = max(0.0, f_val - uncertainty)
        upper = f_val + uncertainty

        item = {
            "date": f_date,
            "actual": None,
            "forecast": round(f_val, 2),
            "lower_bound": round(lower, 2),
            "upper_bound": round(upper, 2)
        }
        forecast_points.append(item)
        hist_chart.append(item)

    return {
        "status": "SUCCESS",
        "model_selected": selected_name,
        "forecast_horizon_days": forecast_horizon_days,
        "evaluation_metrics": {
            "mae": round(best_model_meta["mae"], 2),
            "rmse": round(best_model_meta["rmse"], 2),
            "mape": round(best_model_meta["mape"], 2),
            "wape": round(best_model_meta["wape"], 2)
        },
        "all_model_evaluations": all_models,
        "historical_plus_forecast": hist_chart,
        "forecast_only": forecast_points,
        "projected_total_revenue_30d": round(float(np.sum(forecast_vals)), 2)
    }
