package com.nexora.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.junit.jupiter.api.Assertions.*;

public class DataIngestionZipTest {

    @Test
    public void testZipDatasetParsingInMemory() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            // Add users dimension file
            zos.putNextEntry(new ZipEntry("Users.csv"));
            zos.write("User_ID,Name,Age\nU1,John,30\n".getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();

            // Add transactions fact file
            zos.putNextEntry(new ZipEntry("All_Transactions.csv"));
            zos.write("Transaction_ID,Amount,User_ID,Date,Service Type,Payment_Status\nTX101,500.00,U1,2024-06-09,FASTag Recharge,Successful\n".getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }

        MockMultipartFile file = new MockMultipartFile(
                "file", "phonepe.zip", "application/zip", baos.toByteArray()
        );

        DataIngestionService service = new DataIngestionService(
                null, null, null, null, null, null, null, null, null, null
        );

        java.lang.reflect.Method parseZipMethod = DataIngestionService.class.getDeclaredMethod("parseZip", InputStream.class);
        parseZipMethod.setAccessible(true);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> records = (List<Map<String, Object>>) parseZipMethod.invoke(service, file.getInputStream());

        assertNotNull(records);
        assertEquals(1, records.size());
        Map<String, Object> firstRow = records.get(0);
        assertEquals("TX101", firstRow.get("Transaction_ID"));
        assertEquals("500.00", firstRow.get("Amount"));
        assertEquals("Successful", firstRow.get("Payment_Status"));
    }
}
