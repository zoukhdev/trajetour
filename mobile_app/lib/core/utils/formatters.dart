import 'package:intl/intl.dart';

class DateFormatter {
  static String formatDate(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }
  
  static String formatDateTime(DateTime date) {
    return DateFormat('dd/MM/yyyy HH:mm').format(date);
  }
  
  static String formatTime(DateTime date) {
    return DateFormat('HH:mm').format(date);
  }
  
  static String formatRelative(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays > 365) {
      return '${(difference.inDays / 365).floor()} an${(difference.inDays / 365).floor() > 1 ? 's' : ''}';
    } else if (difference.inDays > 30) {
      return '${(difference.inDays / 30).floor()} mois';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} jour${difference.inDays > 1 ? 's' : ''}';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} heure${difference.inHours > 1 ? 's' : ''}';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''}';
    } else {
      return 'À l\'instant';
    }
  }
  
  static DateTime? parseDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) return null;
    try {
      return DateTime.parse(dateString);
    } catch (e) {
      return null;
    }
  }
}

class CurrencyFormatter {
  static String format(double amount, {String currency = 'DZD'}) {
    final formatter = NumberFormat.currency(
      symbol: _getCurrencySymbol(currency),
      decimalDigits: 2,
    );
    return formatter.format(amount);
  }
  
  static String formatCompact(double amount, {String currency = 'DZD'}) {
    final formatter = NumberFormat.compactCurrency(
      symbol: _getCurrencySymbol(currency),
    );
    return formatter.format(amount);
  }
  
  static String _getCurrencySymbol(String currency) {
    switch (currency) {
      case 'DZD':
        return 'DZD';
      case 'EUR':
        return '€';
      case 'USD':
        return '\$';
      case 'SAR':
        return 'SAR';
      default:
        return currency;
    }
  }
}

class NumberFormatter {
  static String format(num number) {
    return NumberFormat('#,##0.##', 'fr_FR').format(number);
  }
  
  static String formatPercentage(double value) {
    return NumberFormat.percentPattern('fr_FR').format(value);
  }
}
