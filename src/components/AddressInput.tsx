"use client";

import { useState, useRef } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

interface AddressInputProps {
    onPlaceSelected: (place: {
        address: string;
        lat: number;
        lng: number;
    }) => void;
}

export default function AddressInput({ onPlaceSelected }: AddressInputProps) {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places"]
    });

    const onLoad = (autocmp: google.maps.places.Autocomplete) => {
        setAutocomplete(autocmp);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                onPlaceSelected({
                    address: place.formatted_address || place.name || "",
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                });
            }
        }
    };

    if (!isLoaded) return <input className="w-full glass-input px-4 py-3 rounded-xl" placeholder="載入自動完成模組中..." disabled />;

    return (
        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged} className="w-full">
            <input
                type="text"
                placeholder="請輸入欲發放面紙的地點或地址"
                className="w-full glass-input px-4 py-3 rounded-xl"
                ref={inputRef}
            />
        </Autocomplete>
    );
}
