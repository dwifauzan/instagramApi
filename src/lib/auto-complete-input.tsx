import React, { useState, useEffect } from 'react'
import { AutoComplete } from 'antd'
import { autoComplete } from './auto-complete-location' // Sesuaikan path import

interface LocationOption {
    id: string
    name: string
    full_name: string
    location: {
        lat: number
        lng: number
    }
}

interface LocationInputProps {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
}

const LocationInput: React.FC<LocationInputProps> = ({
    value,
    onChange,
    placeholder = 'Masukkan lokasi...',
}) => {
    const [options, setOptions] = useState<LocationOption[]>([])
    const [searchText, setSearchText] = useState('')

    useEffect(() => {
        const fetchLocations = async () => {
            if (searchText.length > 2) {
                const results = await autoComplete(searchText)
                setOptions(results)
            } else {
                setOptions([])
            }
        }

        const debounceTimer = setTimeout(fetchLocations, 300)
        return () => clearTimeout(debounceTimer)
    }, [searchText])

    const handleSearch = (text: string) => {
        setSearchText(text)
    }

    const handleSelect = (value: string, option: any) => {
        if (onChange) {
            onChange(value)
        }
    }

    return (
        <AutoComplete
            value={value}
            options={options.map((opt) => ({
                label: opt.full_name,
                value: opt.full_name,
                key: opt.id,
            }))}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder={placeholder}
            style={{ width: '100%' }}
        />
    )
}

export default LocationInput
