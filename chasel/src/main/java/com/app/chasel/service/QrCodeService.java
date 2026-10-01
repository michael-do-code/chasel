package com.app.chasel.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Service
public class QrCodeService {

    public String fulfillmentDataUrl(String orderNumber, Long itemId, String shippingCode) {
        if (shippingCode == null || shippingCode.isBlank()) {
            return null;
        }

        String payload = "chasel://fulfillment?order=%s&item=%d&code=%s"
                .formatted(orderNumber, itemId, shippingCode);
        try {
            BitMatrix matrix = new QRCodeWriter().encode(payload, BarcodeFormat.QR_CODE, 320, 320);
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (WriterException | IOException exception) {
            throw new IllegalStateException("Could not generate fulfillment QR code", exception);
        }
    }
}
