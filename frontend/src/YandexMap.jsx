// frontend/src/YandexMap.jsx
import React, { useEffect, useRef } from 'react';

// IMPORTANT: You need to replace this with your actual Yandex Maps API key in `frontend/index.html`.

const YandexMap = ({ points }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.ymaps3) {
      console.error("Yandex Maps API is not loaded.");
      return;
    }

    window.ymaps3.ready.then(async () => {
      const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = window.ymaps3;

      // Clear previous map instance if any
      if (mapRef.current) {
          mapRef.current.innerHTML = '';
      }

      // Find the center of the points
      let center = [37.57, 55.75]; // Default center (lng, lat for yandex)
      if (points && points.length > 0) {
        const validPoints = points.filter(p => p.lat && p.lng);
        if (validPoints.length > 0) {
          const lats = validPoints.map(p => p.lat);
          const lngs = validPoints.map(p => p.lng);
          center = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2,
          ];
        }
      }

      const map = new YMap(mapRef.current, {
        location: {
          center: center,
          zoom: 10,
        },
      });

      map.addChild(new YMapDefaultSchemeLayer());
      map.addChild(new YMapDefaultFeaturesLayer());

      if (points) {
        points.forEach(point => {
          if (point.lat && point.lng) {
            const markerElement = document.createElement('div');
            markerElement.className = 'marker';
            markerElement.style.width = '10px';
            markerElement.style.height = '10px';
            markerElement.style.backgroundColor = 'red';
            markerElement.style.borderRadius = '50%';
            const marker = new YMapMarker({ coordinates: [point.lng, point.lat] }, markerElement);
            map.addChild(marker);
          }
        });
      }
    });
  }, [points]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px', marginTop: '16px' }}></div>;
};

export default YandexMap;
