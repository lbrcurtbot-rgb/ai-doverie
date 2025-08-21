// frontend/src/YandexMap.jsx
import React, { useEffect, useRef } from 'react';

// IMPORTANT: You need to replace YOUR_YANDEX_MAPS_API_KEY in `frontend/index.html` with your actual key.

const YandexMap = ({ points }) => {
  const mapRef = useRef(null);
  // Use a ref to keep track of the map instance to prevent re-initialization
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      // If the API is not ready, wait and try again.
      if (!window.ymaps3) {
        setTimeout(initMap, 100);
        return;
      }

      // The API is ready, proceed with initialization.
      window.ymaps3.ready.then(async () => {
        // Prevent re-initialization if the map is already created
        if (mapInstanceRef.current) {
          return;
        }

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = window.ymaps3;

        // Find the center of the points
      let center = [37.89, 55.68]; // Default center to Lyubertsy (lng, lat)
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
          zoom: 12,
          },
        });

        mapInstanceRef.current = map;

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
    };

    initMap();

    return () => {
      // Cleanup the map instance on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [points]); // Rerun effect if points change

  return <div ref={mapRef} style={{ width: '100%', height: '400px', marginTop: '16px' }}></div>;
};

export default YandexMap;
