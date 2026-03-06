"use client";

import { useState, useRef, useEffect } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

interface AddressInputProps {
    onPlaceSelected: (place: {
        address: string;
        lat: number;
        lng: number;
    }) => void;
    placeholder?: string;
    defaultValue?: string;
}

export default function AddressInput({ onPlaceSelected, placeholder = "請輸入欲發放的地點或地址", defaultValue = "" }: AddressInputProps) {
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
    const [inputValue, setInputValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places"],
        language: 'zh-TW',
        region: 'TW'
    });

    useEffect(() => {
        setInputValue(defaultValue);
    }, [defaultValue]);

    const onLoad = (autocmp: google.maps.places.Autocomplete) => {
        setAutocomplete(autocmp);
    };

    const onPlaceChanged = () => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const addr = place.formatted_address || place.name || "";
                setInputValue(addr);
                onPlaceSelected({
                    address: addr,
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
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full glass-input px-4 py-3 rounded-xl text-black md:text-white"
                ref={inputRef}
            />
        </Autocomplete>
    );
}
