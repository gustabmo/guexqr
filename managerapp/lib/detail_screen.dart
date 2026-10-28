import 'package:flutter/material.dart';
import 'api.dart';
import 'utils.dart';

class DetailScreen extends StatefulWidget {
  final String course;
  final String requestId;
  final String shortId;
  final String student;
  final String page;
  final int? num;
  final String state;
  final DateTime requested;

  const DetailScreen({
    super.key,
    required this.course,
    required this.requestId,
    required this.shortId,
    required this.student,
    required this.page,
    required this.num,
    required this.state,
    required this.requested,
  });

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  List<Map<String, dynamic>>? _logs;
  List<String>? _students;
  DateTime? _historyNow;
  String? _loadError;
  bool _acting = false;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _loadError = null);
    try {
      final result = await getHistory(widget.course, widget.student);
      if (mounted) {
        setState(() {
          _logs = result.logs;
          _students = result.students;
          _historyNow = result.now;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadError = e.toString());
    }
  }

  Future<void> _act(String doAction) async {
    setState(() => _acting = true);
    try {
      await doAct(widget.course, widget.requestId, doAction);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() => _acting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  String get _pageLabel {
    final n = widget.num;
    return n != null ? '#$n ${widget.page}' : '#n/a ${widget.page}';
  }

  @override
  Widget build(BuildContext context) {
    final isPending = widget.state == 'pending';
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.student} - req#${widget.shortId}'),
      ),
      body: Column(
        children: [
          Expanded(child: _buildHistory()),
          const Divider(height: 1),
          _buildButtons(isPending),
        ],
      ),
    );
  }

  Widget _buildHistory() {
    if (_loadError != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Erreur : $_loadError', textAlign: TextAlign.center),
            const SizedBox(height: 12),
            TextButton(
                onPressed: _loadHistory, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_logs == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final now = _historyNow!;

    if (_logs!.isEmpty) {
      // First request for this student in this course.
      final timeInQueue = now.difference(widget.requested);
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Première demande pour cet élève',
              style: TextStyle(fontStyle: FontStyle.italic)),
          const SizedBox(height: 4),
          Text(formatDuration(timeInQueue),
              style: const TextStyle(color: Colors.grey)),
          Text('demande en attente pour la page $_pageLabel'),
          if (_students != null && _students!.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Text('Élèves existants :',
                style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            for (final s in _students!) Text(s),
          ],
        ],
      );
    }

    // Log rows interleaved with time intervals.
    final items = <Widget>[];
    for (int i = 0; i < _logs!.length; i++) {
      final log = _logs![i];
      final logPage = log['page'] as String;
      final logNum = log['num'] as int?;
      final loggedTs = log['logged'] as String;
      final logPageLabel =
          logNum != null ? '#$logNum $logPage' : '#n/a $logPage';

      items.add(Text('page $logPageLabel  ${formatTimestamp(loggedTs)}'));

      final logTime = DateTime.parse(loggedTs);
      final intervalEnd = i < _logs!.length - 1
          ? DateTime.parse(_logs![i + 1]['logged'] as String)
          : now;
      items.add(Padding(
        padding: const EdgeInsets.only(left: 16, top: 3, bottom: 3),
        child: Text(
          formatDuration(intervalEnd.difference(logTime)),
          style: const TextStyle(color: Colors.grey),
        ),
      ));
    }
    items.add(Text('demande en attente pour la page $_pageLabel'));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: items,
    );
  }

  Widget _buildButtons(bool isPending) {
    if (_acting) {
      return const Padding(
        padding: EdgeInsets.all(20),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        alignment: WrapAlignment.center,
        children: [
          FilledButton(
            onPressed: isPending ? () => _act('allow') : null,
            child: const Text('Autoriser'),
          ),
          FilledButton(
            onPressed: isPending ? () => _act('refuseName') : null,
            child: const Text('Refuser le nom'),
          ),
          FilledButton.tonal(
            onPressed: isPending ? () => _act('back') : null,
            child: const Text('← Reculer'),
          ),
          FilledButton.tonal(
            onPressed: isPending ? () => _act('forward') : null,
            child: const Text('Avancer →'),
          ),
          FilledButton(
            onPressed: () => _act('delete'),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}
