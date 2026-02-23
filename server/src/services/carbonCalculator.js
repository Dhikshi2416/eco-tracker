const CO2_FACTORS = {
  transport: {
    avoided_car_trip: 2.4,
    public_transit: 0.8,
    cycled: 1.6,
    walked: 1.2,
    carpooled: 1.0,
    electric_vehicle: 0.5,
  },
  food: {
    vegan_meal: 1.5,
    vegetarian_meal: 0.8,
    reduced_meat: 1.0,
    no_food_waste: 0.5,
    local_produce: 0.6,
  },
  energy: {
    turned_off_lights: 0.2,
    line_dried: 0.7,
    cold_wash: 0.6,
    smart_thermostat: 1.2,
    solar_used: 1.8,
  },
  waste: {
    recycled: 0.3,
    composted: 0.5,
    refused_plastic: 0.2,
    repaired_item: 1.5,
    second_hand: 0.8,
  },
  water: {
    short_shower: 0.2,
    fixed_leak: 0.8,
    rain_harvested: 0.3,
    full_dishwasher: 0.4,
  },
};

function calculateCO2(category, type) {
  return CO2_FACTORS[category]?.[type] ?? 0.5;
}

module.exports = {
  CO2_FACTORS,
  calculateCO2,
};
