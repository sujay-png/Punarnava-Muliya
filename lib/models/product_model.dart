import 'package:cloud_firestore/cloud_firestore.dart';

class ProductModel {
  final String id;
  final String name;
  final int price;
  final String offerText;
  final String orderLink;
  final bool featured;

  const ProductModel({
    required this.id,
    required this.name,
    required this.price,
    required this.offerText,
    required this.orderLink,
    required this.featured,
  });

  factory ProductModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return ProductModel(
      id: doc.id,
      name: d['name'] ?? '',
      price: (d['price'] ?? 0) as int,
      offerText: d['offerText'] ?? '',
      orderLink: d['orderLink'] ?? '',
      featured: d['featured'] ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'price': price,
        'offerText': offerText,
        'orderLink': orderLink,
        'featured': featured,
      };
}
