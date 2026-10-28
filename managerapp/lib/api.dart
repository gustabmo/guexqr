import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config.dart';

class ApiException implements Exception {
  final String message;
  const ApiException(this.message);
  @override
  String toString() => message;
}

Future<Map<String, dynamic>> _post(Map<String, dynamic> body) async {
  final client = http.Client();
  try {
    final req = http.Request('POST', Uri.parse(backendUrl))
      ..headers['content-type'] = 'text/plain'
      ..body = jsonEncode(body);

    final streamed = await client.send(req);

    http.Response resp;
    if (streamed.statusCode == 302) {
      // Google Apps Script always redirects POST → GET.
      final location = streamed.headers['location']!;
      resp = await http.get(Uri.parse(location));
    } else {
      resp = await http.Response.fromStream(streamed);
    }

    final data = jsonDecode(resp.body) as Map<String, dynamic>;
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
