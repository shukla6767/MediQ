// This Component doesn't know about MongoDB.
// It only returns a selected place.
// This component doesn't save the data it just says i found the place

interface HospitalSearchProps {
    onPlaceSelect: (place: SelectedPlace) => void;

}

