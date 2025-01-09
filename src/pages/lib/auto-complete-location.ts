import axios from 'axios'
const autoComplete = async (query: string) => {
    if (!query) return []

    try {
        const response = await axios.get(
            `https://api-cdn.sygictraveldata.com/v2.6/en/places/list?query=${query}&preferred_location=49.26780455063753%2C16.724624633789066`
        )

        // Memfilter data untuk mengambil informasi yang relevan
        const filteredPlaces = response.data.data.places.map((place: any) => ({
            id: place.id,
            name: place.name,
            address: place.name_suffix,
            location: {
                lat: place.location.lat,
                lng: place.location.lng,
            },
            external_id: place.id,
            external_id_source: 'sygic_travel_id',
        }))

        return filteredPlaces
    } catch (error) {
        console.error(error)
        return [] // Mengembalikan array kosong jika terjadi kesalahan
    }
}

export default autoComplete
