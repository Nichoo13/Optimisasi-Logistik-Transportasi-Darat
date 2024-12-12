document.addEventListener('DOMContentLoaded', () => {
    const platform = new H.service.Platform({
        apikey: 'rfpUHuiYg5Y1XqbJL21uo5pKiHeKpBB6OPWe4aMnh8Y'
    });

    const defaultLayers = platform.createDefaultLayers();

    const map = new H.Map(
        document.getElementById('map'),
        defaultLayers.vector.normal.map,
        {
            zoom: 10,
            center: { lat: -6.200000, lng: 106.816666 }
        }
    );

    const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, defaultLayers);

    let currentPolyline = null;

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const earthRadius = 6371; // Radius bumi dalam kilometer
        const toRadians = deg => deg * (Math.PI / 180);

        lat1 = toRadians(lat1);
        lon1 = toRadians(lon1);
        lat2 = toRadians(lat2);
        lon2 = toRadians(lon2);

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadius * c;
    };

    const calculateLogistics = (distance, capacity, costPerKm, averageFuel) => {
        let totalCost, marginalCost;

        if (capacity <= 1000) {
            totalCost = (100000 / capacity) + distance * costPerKm * (capacity / 1000) + ((distance / averageFuel) * 6800);
            marginalCost = (-100000 / (capacity * capacity)) + distance * costPerKm / 1000;
        } else if (capacity <= 5000) {
            totalCost = (300000 / capacity) + distance * costPerKm * (capacity / 5000) + ((distance / averageFuel) * 6800);
            marginalCost = (-300000 / (capacity * capacity)) + distance * costPerKm / 5000;
        } else if (capacity <= 20000) {
            totalCost = (750000 / capacity) + distance * costPerKm * (capacity / 20000) + ((distance / averageFuel) * 6800);
            marginalCost = (-750000 / (capacity * capacity)) + distance * costPerKm / 20000;
        } else {
            totalCost = (2000000 / capacity) + distance * costPerKm * (capacity / 40000) + ((distance / averageFuel) * 6800);
            marginalCost = (-2000000 / (capacity * capacity)) + distance * costPerKm / 40000;
        }

        return {
            totalCost: totalCost.toFixed(2),
            marginalCost: marginalCost.toFixed(2),
            totalDistance: distance.toFixed(2)
        };
    };

    document.getElementById('logisticsForm').addEventListener('submit', event => {
        event.preventDefault();

        const start = document.getElementById('start').value.split(',').map(Number);
        const destination = document.getElementById('destination').value.split(',').map(Number);
        const costPerKm = parseFloat(document.getElementById('cost').value);
        const capacity = parseFloat(document.getElementById('capacity').value);
        const averageFuel = parseFloat(document.getElementById('average_fuel').value);

        const distance = haversineDistance(start[0], start[1], destination[0], destination[1]);
        const logistics = calculateLogistics(distance, capacity, costPerKm, averageFuel);

        document.getElementById('result').innerHTML = `
            <strong>Hasil Optimasi:</strong><br>
            Total Biaya: Rp ${logistics.totalCost} <br>
            Total Jarak: ${logistics.totalDistance} km<br>
            Biaya Marginal: Rp ${logistics.marginalCost} <br>
        `;

        if (currentPolyline) {
            map.removeObject(currentPolyline);
        }

        const addRouteToMap = route => {
            const lineString = new H.geo.LineString();
            route.forEach(point => lineString.pushPoint({ lat: point[0], lng: point[1] }));

            currentPolyline = new H.map.Polyline(lineString, {
                style: { strokeColor: 'blue', lineWidth: 4 }
            });

            map.addObject(currentPolyline);
            map.getViewModel().setLookAtData({ bounds: currentPolyline.getBoundingBox() });
        };

        addRouteToMap([start, destination]);
    });
});