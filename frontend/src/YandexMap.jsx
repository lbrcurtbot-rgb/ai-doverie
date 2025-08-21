// frontend/src/YandexMap.jsx
import React, { useEffect, useRef } from 'react';

const YandexMap = ({ points }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      if (!window.ymaps3) {
        setTimeout(initMap, 100);
        return;
      }

      window.ymaps3.ready.then(async () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = window.ymaps3;

        let center = [37.89, 55.68]; // Default center to Lyubertsy (lng, lat)
        let zoom = 12;

        const validPoints = points.filter(p => p.lat && p.lng);
        if (validPoints.length > 0) {
          const lats = validPoints.map(p => p.lat);
          const lngs = validPoints.map(p => p.lng);
          center = [
            (Math.min(...lngs) + Math.max(...lngs)) / 2,
            (Math.min(...lats) + Math.max(...lats)) / 2,
          ];
          zoom = 13; // Zoom in closer when showing points
        }

        const map = new YMap(mapRef.current, {
          location: { center, zoom },
        });

        mapInstanceRef.current = map;

        map.addChild(new YMapDefaultSchemeLayer());
        map.addChild(new YMapDefaultFeaturesLayer());

        validPoints.forEach(point => {
          const markerElement = document.createElement('div');
          markerElement.className = 'marker';
          markerElement.style.width = '10px';
          markerElement.style.height = '10px';
          markerElement.style.backgroundColor = 'red';
          markerElement.style.borderRadius = '50%';
          const marker = new YMapMarker({ coordinates: [point.lng, point.lat] }, markerElement);
          map.addChild(marker);
        });
      });
    };

    initMap();

    // Cleanup on component unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [points]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px', marginTop: '16px' }} />;
};

export default YandexMap;
