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
        libraries: ["places"],
        language: 'zh-TW',
        region: 'TW'
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
                        icon={(loc as any).type === 'BILLBOARD' ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : undefined}
                    >
                        {isSelected && (
                            <InfoWindow onCloseClick={() => onSelectMarker(null)}>
                                <div className="p-3 min-w-[220px] text-gray-800">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className="font-bold text-base truncate text-gray-900" title={(loc as any).name || loc.address}>
                                            {(loc as any).name || loc.address}
                                        </h3>
                                        {(loc as any).type === 'BILLBOARD' && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">看板</span>
                                        )}
                                    </div>

                                    {(loc as any).name && (
                                        <p className="text-xs text-gray-500 mb-2 truncate" title={loc.address}>{loc.address}</p>
                                    )}

                                    {(loc as any).type !== 'BILLBOARD' && (
                                        <div className="text-sm mt-2">
                                            {(loc as any).contactName && (
                                                <p className="flex justify-between border-b border-gray-100 pb-1.5 mb-1.5">
                                                    <span className="text-gray-500 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                        聯絡人:
                                                    </span>
                                                    <span className="font-medium text-gray-700">{(loc as any).contactName}</span>
                                                </p>
                                            )}
                                            <p className="flex justify-between border-b border-gray-100 pb-1.5 mb-1.5">
                                                <span className="text-gray-500 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                                    電話:
                                                </span>
                                                <span className="font-medium text-blue-600">{loc.contactPhone || '無'}</span>
                                            </p>
                                            <p className="flex justify-between items-center pt-1.5">
                                                <span className="text-gray-500">歷史發放:</span>
                                                <span className="text-base font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">{totalQuantity} 盒</span>
                                            </p>
                                        </div>
                                    )}
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
