import axios from 'axios'

export const autoComplete = async (query: string) => {
    if (!query) return []
    try {
        const response = await axios.get(
            `https://api-cdn.sygictraveldata.com/v2.6/en/places/list?query=${query}&preferred_location=49.26780455063753%2C16.724624633789066`
        )

        // Memfilter data untuk mengambil informasi yang relevan
        const filteredPlaces = response.data.data.places.map((place: any) => ({
            id: place.id,
            name: place.name,
            full_name: `${place.name}, ${place.name_suffix || ''}`.trim(),
            location: {
                lat: place.location.lat,
                lng: place.location.lng,
            },
        }))

        return filteredPlaces
    } catch (error) {
        console.error(error)
        return [] // Mengembalikan array kosong jika terjadi kesalahan
    }
}
