from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd

from app.metrics.kpis import calculate_kpis
from app.metrics.industry_analytics import compute_adaptive_industry_analytics
from app.profiling.quality import generate_quality_report
from app.cleaning.sanitizer import auto_detect_column_mapping, clean_and_transform_dataframe
from app.sales.sales_analytics import compute_sales_analytics
from app.products.product_intelligence import compute_product_intelligence
from app.customers.customer_analytics import compute_customer_analytics
from app.inventory.inventory_intelligence import compute_inventory_intelligence
from app.root_cause.analyzer import run_root_cause_analysis
from app.forecasting.forecaster import generate_sales_forecast
from app.anomaly.detector import detect_anomalies
from app.simulation.simulator import run_what_if_simulation
from app.recommendations.insight_generator import generate_business_insights
from app.copilot.analyst_copilot import chat_with_copilot

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

class DatasetPayload(BaseModel):
    orders: Optional[List[Dict[str, Any]]] = None
    records: Optional[List[Dict[str, Any]]] = None
    industry: Optional[str] = "RETAIL"
    products: Optional[List[Dict[str, Any]]] = None
    customers: Optional[List[Dict[str, Any]]] = None
    inventory: Optional[List[Dict[str, Any]]] = None
    marketing: Optional[List[Dict[str, Any]]] = None
    previous_orders: Optional[List[Dict[str, Any]]] = None
    previous_records: Optional[List[Dict[str, Any]]] = None

class SimulationRequest(BaseModel):
    orders: Optional[List[Dict[str, Any]]] = None
    records: Optional[List[Dict[str, Any]]] = None
    price_change_pct: float = 0.0
    discount_change_pct: float = 0.0
    marketing_spend_change_pct: float = 0.0
    volume_shock_pct: float = 0.0
    cost_change_pct: float = 0.0
    price_elasticity: float = -1.2
    marketing_elasticity: float = 0.25

class CopilotRequest(BaseModel):
    query: str
    orders: Optional[List[Dict[str, Any]]] = None
    records: Optional[List[Dict[str, Any]]] = None
    industry: Optional[str] = "RETAIL"
    products: Optional[List[Dict[str, Any]]] = None
    inventory: Optional[List[Dict[str, Any]]] = None

class ProfileRequest(BaseModel):
    records: List[Dict[str, Any]]
    table_type: str = "orders"

class RootCauseRequest(BaseModel):
    current_orders: Optional[List[Dict[str, Any]]] = None
    previous_orders: Optional[List[Dict[str, Any]]] = None
    current_records: Optional[List[Dict[str, Any]]] = None
    previous_records: Optional[List[Dict[str, Any]]] = None
    industry: Optional[str] = "RETAIL"
    target_kpi: str = "revenue"

def _resolve_dataframe(payload_dict: Optional[List[Dict[str, Any]]], fallback: Optional[List[Dict[str, Any]]]) -> pd.DataFrame:
    data = payload_dict if payload_dict is not None else fallback
    return pd.DataFrame(data) if data else pd.DataFrame()

@router.post("/profile")
def profile_dataset(payload: ProfileRequest):
    df = pd.DataFrame(payload.records)
    quality = generate_quality_report(df, table_type=payload.table_type)
    mapping = auto_detect_column_mapping(list(df.columns)) if not df.empty else {}
    return {
        "quality_report": quality,
        "suggested_mapping": mapping
    }

@router.post("/kpis")
def get_kpis(payload: DatasetPayload):
    df_cur = _resolve_dataframe(payload.records, payload.orders)
    raw_prev = payload.previous_records if payload.previous_records is not None else payload.previous_orders
    df_prev = pd.DataFrame(raw_prev) if raw_prev else None
    return calculate_kpis(df_cur, df_prev, industry=payload.industry or "RETAIL")

@router.post("/sales")
@router.post("/trends")
def get_sales_analytics(payload: DatasetPayload):
    df_data = _resolve_dataframe(payload.records, payload.orders)
    df_prod = pd.DataFrame(payload.products) if payload.products else None
    return compute_adaptive_industry_analytics(df_data, df_prod, industry=payload.industry or "RETAIL")

@router.post("/products")
def get_product_intelligence(payload: DatasetPayload):
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    df_prod = pd.DataFrame(payload.products) if payload.products else None
    return compute_product_intelligence(df_ord, df_prod)

@router.post("/customers")
def get_customer_analytics(payload: DatasetPayload):
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    df_cust = pd.DataFrame(payload.customers) if payload.customers else None
    return compute_customer_analytics(df_ord, df_cust)

@router.post("/inventory")
def get_inventory_intelligence(payload: DatasetPayload):
    df_inv = pd.DataFrame(payload.inventory) if payload.inventory else pd.DataFrame()
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    df_prod = pd.DataFrame(payload.products) if payload.products else None
    return compute_inventory_intelligence(df_inv, df_ord, df_prod)

@router.post("/root-cause")
def get_root_cause(payload: RootCauseRequest):
    df_cur = _resolve_dataframe(payload.current_records, payload.current_orders)
    df_prev = _resolve_dataframe(payload.previous_records, payload.previous_orders)
    return run_root_cause_analysis(df_cur, df_prev, target_kpi=payload.target_kpi)

@router.post("/forecast")
def get_sales_forecast(payload: DatasetPayload, days: int = 30):
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    return generate_sales_forecast(df_ord, forecast_horizon_days=days)

@router.post("/anomalies")
def get_anomalies(payload: DatasetPayload):
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    df_inv = pd.DataFrame(payload.inventory) if payload.inventory else None
    return {"anomalies": detect_anomalies(df_ord, df_inv)}

@router.post("/simulate")
def simulate_scenario(payload: SimulationRequest):
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    return run_what_if_simulation(
        df_orders=df_ord,
        price_change_pct=payload.price_change_pct,
        discount_change_pct=payload.discount_change_pct,
        marketing_spend_change_pct=payload.marketing_spend_change_pct,
        volume_shock_pct=payload.volume_shock_pct,
        cost_change_pct=payload.cost_change_pct,
        price_elasticity=payload.price_elasticity,
        marketing_elasticity=payload.marketing_elasticity
    )

@router.post("/insights")
def get_insights(payload: DatasetPayload):
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    df_inv = pd.DataFrame(payload.inventory) if payload.inventory else None
    df_mkt = pd.DataFrame(payload.marketing) if payload.marketing else None
    return {"insights": generate_business_insights(df_ord, df_inv, df_mkt)}

@router.post("/copilot")
def copilot_chat(payload: CopilotRequest):
    df_ord = _resolve_dataframe(payload.records, payload.orders)
    df_prod = pd.DataFrame(payload.products) if payload.products else None
    df_inv = pd.DataFrame(payload.inventory) if payload.inventory else None
    return chat_with_copilot(payload.query, df_ord, df_prod, df_inv)
