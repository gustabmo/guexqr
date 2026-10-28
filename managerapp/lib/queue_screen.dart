import 'dart:async';
import 'package:flutter/material.dart';
import 'api.dart';
import 'detail_screen.dart';
import 'utils.dart';

class QueueScreen extends StatefulWidget {
  final String course;
  const QueueScreen({super.key, required this.course});

  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  Timer? _timer;
  List<Map<String, dynamic>>? _requests;
  DateTime? _serverNow;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _poll();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _poll());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _poll() async {
    try {
      final result = await getQueue(widget.course);
      if (mounted) {
        setState(() {
          _requests = result.requests;
          _serverNow = result.now;
          _error = null;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  // Shortest prefix (≥ 2 digits) that uniquely identifies this requestId
  // among all currently listed requests.
  String _abbrev(String requestId) {
    for (int len = 2; len < 10; len++) {
      final prefix = requestId.substring(0, len);
      final conflict = _requests!.any(
        (r) =>
            r['requestId'] != requestId &&
            (r['requestId'] as String).startsWith(prefix),
      );
      if (!conflict) return prefix;
    }
    return requestId; // all 10 digits needed (very unlikely)
  }

  String _stateLabel(String state) => switch (state) {
        'allowing' => 'validation…',
        'movingBack' => 'recul…',
        'movingForward' => 'avance…',
        'refusingName' => 'refus nom…',
        _ => state,
      };

  Future<void> _openDetail(Map<String, dynamic> r, String abbrev) async {
    _timer?.cancel();
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DetailScreen(
          course: widget.course,
          requestId: r['requestId'] as String,
          shortId: abbrev,
          student: r['student'] as String,
          page: r['page'] as String,
          num: r['num'] as int?,
          state: r['state'] as String,
          requested: DateTime.parse(r['requested'] as String),
        ),
      ),
    );
    // Restart polling and refresh immediately on return.
    _poll();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _poll());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('File — ${widget.course}'),
        actions: [
          if (_loading && _requests != null)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _poll),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading && _requests == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null && _requests == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Erreur : $_error', textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: _poll, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_requests!.isEmpty) {
      return const Center(
        child: Text('Aucune demande en attente',
            style: TextStyle(color: Colors.grey)),
      );
    }

    final now = _serverNow!;
    return ListView.separated(
      itemCount: _requests!.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, i) {
        final r = _requests![i];
        final requestId = r['requestId'] as String;
        final student = r['student'] as String;
        final page = r['page'] as String;
        final num = r['num'] as int?;
        final state = r['state'] as String;
        final requested = DateTime.parse(r['requested'] as String);
        final timeInQueue = now.difference(requested);
        final abbrev = _abbrev(requestId);
        final isPending = state == 'pending';
        final pageLabel = num != null ? '#$num $page' : '#n/a $page';

        return ListTile(
          leading: SizedBox(
            width: 40,
            child: Text(
              abbrev,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'monospace',
                color: isPending ? null : Colors.orange,
              ),
            ),
          ),
          title: Text(student),
          subtitle: Text('$pageLabel  •  ${formatDuration(timeInQueue)}'),
          trailing: isPending
              ? null
              : Text(
                  _stateLabel(state),
                  style: const TextStyle(color: Colors.orange, fontSize: 12),
                ),
          onTap: () => _openDetail(r, abbrev),
        );
      },
    );
  }
}
