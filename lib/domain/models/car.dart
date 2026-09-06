class Car {
  final String id;
  final String brand;
  final String model;
  final String category; // SUV, Sedan, Hatchback, Luxury, EV
  final double rating;
  final int reviewsCount;
  final double distance; // in km
  final double pricePerDay;
  final double securityDeposit;
  final int includedKm;
  final double extraKmCharge;
  final String transmission; // Manual, Automatic
  final String fuel; // Petrol, Diesel, EV
  final String pickupType; // Self pickup, Doorstep delivery
  final String providerName;
  final String imageUrl;
  final List<String> photos;

  Car({
    required this.id,
    required this.brand,
    required this.model,
    required this.category,
    required this.rating,
    required this.reviewsCount,
    required this.distance,
    required this.pricePerDay,
    required this.securityDeposit,
    required this.includedKm,
    required this.extraKmCharge,
    required this.transmission,
    required this.fuel,
    required this.pickupType,
    required this.providerName,
    required this.imageUrl,
    required this.photos,
  });
}
