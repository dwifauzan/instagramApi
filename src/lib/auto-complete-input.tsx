import React, { useState, useEffect } from 'react'
import { AutoComplete } from 'antd'
import { autoComplete } from './auto-complete-location'

interface LocationOption {
    id: string
    name: string
    address: string
    location: {
        lat: number
        lng: number
    }
    external_id: string
    external_id_source: string
}

interface LocationValue {
    name: string
    address: string
    location: {
        lat: number
        lng: number
    }
    external_id: string
    external_id_source: string
}

interface LocationInputProps {
    value?: LocationValue
    onChange?: (value: LocationValue) => void
    placeholder?: string
}

const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    placeholder = 'Masukkan lokasi...',
}) => {
    const [options, setOptions] = useState<LocationOption[]>([])
    const [inputValue, setInputValue] = useState('')

    // Fetch lokasi saat mengetik
    useEffect(() => {
        const fetchLocations = async () => {
            if (inputValue.length > 2) {
                try {
                    const results = await autoComplete(inputValue)
                    setOptions(results)
                } catch (error) {
                    console.error('Error fetching locations:', error)
                    setOptions([])
                }
            } else {
                setOptions([])
            }
        }

        const debounceTimer = setTimeout(fetchLocations, 300)
        return () => clearTimeout(debounceTimer)
    }, [inputValue])

    // Handler saat mengetik
    const handleSearch = (text: string) => {
        setInputValue(text)
        if (onChange) {
            onChange({
                name: text,
                address: '',
                location: { lat: 0, lng: 0 },
                external_id: '',
                external_id_source: '',
            })
        }
    }

    // Handler saat memilih opsi
    const handleSelect = (selectedValue: string, option: any) => {
        const selectedLocation = options.find(
            (opt) => `${opt.name}, ${opt.address}` === option.label
        )
        if (selectedLocation && onChange) {
            onChange(selectedLocation)
            setInputValue(
                `${selectedLocation.name}, ${selectedLocation.address}`
            )
        }
        // Mencegah AutoComplete menutup dropdown
        return false
    }

    return (
        <AutoComplete
            value={inputValue}
            options={options.map((opt) => ({
                label: `${opt.name}, ${opt.address}`,
                value: `${opt.name}, ${opt.address}`,
                key: opt.id,
            }))}
            onSearch={handleSearch}
            onSelect={handleSelect}
            onBlur={() =>
                setInputValue(`${value?.name ?? ''}, ${value?.address ?? ''}`)
            }
            placeholder={placeholder}
            style={{ width: '100%' }}
        />
    )
}

export default LocationInput
