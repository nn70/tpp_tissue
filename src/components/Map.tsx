"use client";

import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Location, DistributionRecord } from "@prisma/client";

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "1rem"
};

const defaultCenter = {
    lat: 25.0330,  // 預設台北市中心
    lng: 121.5654
};

type LocationWithRecords = Location & {
    records: DistributionRecord[];
};

interface MapProps {
    locations: LocationWithRecords[];
    selectedLocationId: string | null;
    onSelectMarker: (id: string | null) => void;
}

export default function Map({ locations, selectedLocationId, onSelectMarker }: MapProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places"]
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // 當選擇地點改變時移動地圖視角
    if (map && selectedLocationId) {
        const target = locations.find(l => l.id === selectedLocationId);
        if (target && target.latitude && target.longitude) {
            map.panTo({ lat: target.latitude, lng: target.longitude });
            map.setZoom(16);
        }
    }

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
            }}
        >
            {locations.map((loc) => {
                if (!loc.latitude || !loc.longitude) return null;

                const isSelected = selectedLocationId === loc.id;
                const totalQuantity = loc.records.reduce((sum, r) => sum + r.quantity, 0);

                return (
                    <Marker
                        key={loc.id}
                        position={{ lat: loc.latitude, lng: loc.longitude }}
                        onClick={() => onSelectMarker(loc.id)}
                        animation={isSelected && window.google ? window.google.maps.Animation.BOUNCE : undefined}
                    >
                        {isSelected && (
                            <InfoWindow onCloseClick={() => onSelectMarker(null)}>
                                <div className="p-2 min-w-[200px] text-gray-800">
                                    <h3 className="font-bold text-base mb-1 truncate" title={loc.address}>{loc.address}</h3>
                                    <div className="text-sm">
                                        <p className="flex justify-between border-b pb-1 mb-1">
                                            <span className="text-gray-500">聯絡電話:</span>
                                            <span className="font-medium text-blue-600">{loc.contactPhone || '無'}</span>
                                        </p>
                                        <p className="flex justify-between items-center pt-1">
                                            <span className="text-gray-500">歷史總發放:</span>
                                            <span className="text-lg font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{totalQuantity} 盒</span>
                                        </p>
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                    </Marker>
                );
            })}
        </GoogleMap>
    ) : (
        <div className="flex items-center justify-center w-full h-full bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-purple-200">Loading Map Engine...</p>
            </div>
        </div>
    );
}
