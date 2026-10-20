import 'package:flutter/material.dart';
import 'package:guexqr/barcode_scanner_simple.dart';

void main() {
  runApp(
    const MaterialApp(
      title: 'guexQR',
      home: BarcodeScannerSimple(),
    ),
  );
}
