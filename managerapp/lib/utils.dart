// Duration formats: 50"  |  10' 15"  |  2h 15'  |  3d 5h
String formatDuration(Duration d) {
  final s = d.inSeconds.abs();
  if (s < 60) return '$s"';
  if (d.inMinutes < 60) return "${d.inMinutes}' ${s % 60}\"";
  if (d.inHours < 24) return "${d.inHours}h ${d.inMinutes % 60}'";
  return "${d.inDays}d ${d.inHours % 24}h";
}

// yyyy-mm-dd hh:mm:ss in local time
String formatTimestamp(String isoString) {
  final dt = DateTime.parse(isoString).toLocal();
  final d = dt.day.toString().padLeft(2, '0');
  final mo = dt.month.toString().padLeft(2, '0');
  final h = dt.hour.toString().padLeft(2, '0');
  final mi = dt.minute.toString().padLeft(2, '0');
  final s = dt.second.toString().padLeft(2, '0');
  return '${dt.year}-$mo-$d $h:$mi:$s';
}
