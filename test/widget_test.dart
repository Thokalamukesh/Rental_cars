import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:selfdrive_cars/main.dart';

void main() {
  testWidgets('app renders the home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: SelfDriveCarApp()));

    await tester.pumpAndSettle();

    expect(find.text('Zoomcar / Zymo Clone'), findsOneWidget);
    expect(find.text('Home Screen (Location First)'), findsOneWidget);
    expect(find.byIcon(Icons.home), findsOneWidget);
  });
}
