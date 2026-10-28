import 'dart:convert';
import 'dart:io';
import 'config.dart';

class ApiException implements Exception {
  final String message;
  const ApiException(this.message);
  @override
  String toString() => message;
}

Future<Map<String, dynamic>> _post(Map<String, dynamic> body) async {
  final client = HttpClient()
    ..connectionTimeout = const Duration(seconds: 15);
  try {
    final req = await client.postUrl(Uri.parse(backendUrl));
    // Disable auto-redirect so we can follow the 302 with GET ourselves.
    req.followRedirects = false;
    req.headers.set('content-type', 'text/plain');
    req.write(jsonEncode(body));
    final resp = await req.close();

    String raw;
    if (resp.statusCode == 302) {
      // Google Apps Script always redirects POST → GET.
      final location = resp.headers.value('location')!;
      final getReq = await client.getUrl(Uri.parse(location));
      final getResp = await getReq.close();
      raw = await getResp.transform(utf8.decoder).join();
    } else {
      raw = await resp.transform(utf8.decoder).join();
    }

    final data = jsonDecode(raw) as Map<String, dynamic>;
    if (data['ok'] != true) {
      throw ApiException(data['error'] as String? ?? 'unknown error');
    }
    return data;
  } finally {
    client.close();
  }
}

Future<String> getConfig() async {
  final data = await _post({'action': 'config'});
  return data['course'] as String;
}

typedef QueueResult = ({
  List<Map<String, dynamic>> requests,
  DateTime now,
});

Future<QueueResult> getQueue(String course) async {
  final data =
      await _post({'action': 'queue', 'key': managerKey, 'course': course});
  return (
    requests: (data['requests'] as List).cast<Map<String, dynamic>>(),
    now: DateTime.parse(data['now'] as String),
  );
}

typedef HistoryResult = ({
  List<Map<String, dynamic>> logs,
  List<String>? students,
  DateTime now,
});

Future<HistoryResult> getHistory(String course, String student) async {
  final data = await _post({
    'action': 'history',
    'key': managerKey,
    'course': course,
    'student': student,
  });
  return (
    logs: (data['logs'] as List).cast<Map<String, dynamic>>(),
    students: data['students'] != null
        ? (data['students'] as List).cast<String>()
        : null,
    now: DateTime.parse(data['now'] as String),
  );
}

Future<void> doAct(String course, String requestId, String doAction) async {
  await _post({
    'action': 'act',
    'key': managerKey,
    'course': course,
    'requestId': requestId,
    'do': doAction,
  });
}
