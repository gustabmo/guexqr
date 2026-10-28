import 'package:flutter/material.dart';
import 'api.dart';
import 'queue_screen.dart';

void main() {
  runApp(const MaterialApp(
    title: 'guexQR',
    theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
    home: _AppRoot(),
  ));
}

class _AppRoot extends StatefulWidget {
  const _AppRoot();

  @override
  State<_AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<_AppRoot> {
  String? _course;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    setState(() => _error = null);
    try {
      final course = await getConfig();
      if (mounted) setState(() => _course = course);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Erreur : $_error', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: _loadConfig, child: const Text('Réessayer')),
            ],
          ),
        ),
      );
    }
    if (_course == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return QueueScreen(course: _course!);
  }
}
