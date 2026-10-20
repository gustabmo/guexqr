import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class BarcodeScannerSimple extends StatefulWidget {
  const BarcodeScannerSimple({super.key});

  @override
  State<BarcodeScannerSimple> createState() => _BarcodeScannerSimpleState();
}

class _BarcodeScannerSimpleState extends State<BarcodeScannerSimple> {
  Barcode? _barcode;

  int crc32(String data) {
    const polynomial = 0xEDB88320;
    int crc = 0xFFFFFFFF;
    for (int i = 0; i < data.length; i++) {
      crc ^= data.codeUnitAt(i);
      for (int j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) != 0 ? polynomial : 0);
      }
    }
    return crc ^ 0xFFFFFFFF;
  }

  String getCode(String text) {
    if ((text.length >= 6) && (text.startsWith('guexqr:coursinformatique'))) {
      return (crc32(text) % 100000).toString();
    } else {
      return "no code";
    }
  }

  Widget _buildBarcode(Barcode? value) {
    String displaySt = 'scan...';

    if (value != null) {
      displaySt = getCode(value.displayValue ?? "");
    }

    return Text(
      displaySt,
      style: TextStyle(
        color: Colors.white,
        fontSize: 50,
      ),
    );
  }

  void _handleBarcode(BarcodeCapture barcodes) {
    if (mounted) {
      setState(() {
        _barcode = barcodes.barcodes.firstOrNull;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('guexQR Scan QR Code'),
      ),
      backgroundColor: Colors.black,
      body: Column(
        children: [
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              alignment: Alignment.bottomCenter,
              height: 100,
              color: Colors.black.withValues(alpha: 0.4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Expanded(child: Center(child: _buildBarcode(_barcode))),
                ],
              ),
            ),
          ),
          SizedBox(
            height: 450,
            child: MobileScanner(
              onDetect: _handleBarcode,
            ),
          ),
        ],
      ),
    );
  }
}
