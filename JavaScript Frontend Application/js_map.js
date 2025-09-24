class TestingCenterMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.initMap();
    }

    initMap() {
        // Initialize Google Maps or OpenStreetMap
        this.map = L.map('testing-centers-map').setView([-26.2041, 28.0473], 10); // Johannesburg coordinates

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.addTestingCenters();
    }

    async addTestingCenters() {
        try {
            const response = await fetch('api/centers.php');
            const centers = await response.json();
            
            centers.forEach(center => {
                const marker = L.marker([center.latitude, center.longitude])
                    .addTo(this.map)
                    .bindPopup(`
                        <b>${center.name}</b><br>
                        ${center.address}<br>
                        📞 ${center.phone}<br>
                        Slots: ${center.available_slots}
                    `);
                
                this.markers.push(marker);
            });
        } catch (error) {
            console.error('Error loading centers for map:', error);
        }
    }
}
