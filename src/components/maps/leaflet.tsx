import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css?url=false';

interface LeafletMapBasicProps {
  latitude: number;
  longitude: number;
  width: string;
  height: string;
  zoom: number;
}

function LeafletMapBasic(props:LeafletMapBasicProps) {
  const { latitude, longitude, width, height, zoom } = props;

  const position:any = [latitude, longitude];

  return (
    <>
      <MapContainer  className="relative [&>.leaflet-map-pane]:w-full [&>.leaflet-map-pane]:h-full" style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            A pretty CSS3 popup.
            <br />
            Easily customizable.
          </Popup>
        </Marker>
      </MapContainer>
    </>
  );
}

function LeafletMapMultipleIcon(props:any) {
  const { latitude, longitude, width, height, zoom, data } = props;

  const position:any = [latitude, longitude];
  return (
    <div>
      <MapContainer  className="relative [&>.leaflet-map-pane]:w-full [&>.leaflet-map-pane]:h-full" style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data.map((item:any) => {
          return (
            <Marker key={item.id} position={item.position}>
              <Popup>
                A pretty CSS3 popup.
                <br />
                Easily customizable.
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function LeafletMapCustomIcon(props:any) {
  const { latitude, longitude, width, height, zoom, faIcon } = props;

  const position:any = [latitude, longitude];
  return (
    <div>
      <MapContainer  className="relative" style={{ height: '400px', width: '100%' }}>
      </MapContainer>
    </div>
  );
}

function LeafletMarkerCluster(props:any) {
  const { latitude, longitude, width, height, zoom, data } = props;

  const position:any = [latitude, longitude];
  return (
    <div>
      <MapContainer className="markercluster-map relative" style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <>
          {data.map((item:any) => {
            return (
              <Marker key={item.id} position={item.position}>
                <Popup>
                  A pretty CSS3 popup.
                  <br />
                  Easily customizable.
                </Popup>
              </Marker>
            );
          })}
        </>
      </MapContainer>
    </div>
  );
}

export { LeafletMapBasic, LeafletMapMultipleIcon, LeafletMapCustomIcon, LeafletMarkerCluster };
