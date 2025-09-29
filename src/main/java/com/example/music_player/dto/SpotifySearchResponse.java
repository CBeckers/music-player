package com.example.music_player.dto;

import java.util.List;

public class SpotifySearchResponse {
    
    private TrackSearchResult tracks;

    public TrackSearchResult getTracks() {
        return tracks;
    }

    public void setTracks(TrackSearchResult tracks) {
        this.tracks = tracks;
    }

    public static class TrackSearchResult {
        private String href;
        private List<SpotifyTrack> items;
        private int limit;
        private String next;
        private int offset;
        private String previous;
        private int total;

        public String getHref() {
            return href;
        }

        public void setHref(String href) {
            this.href = href;
        }

        public List<SpotifyTrack> getItems() {
            return items;
        }

        public void setItems(List<SpotifyTrack> items) {
            this.items = items;
        }

        public int getLimit() {
            return limit;
        }

        public void setLimit(int limit) {
            this.limit = limit;
        }

        public String getNext() {
            return next;
        }

        public void setNext(String next) {
            this.next = next;
        }

        public int getOffset() {
            return offset;
        }

        public void setOffset(int offset) {
            this.offset = offset;
        }

        public String getPrevious() {
            return previous;
        }

        public void setPrevious(String previous) {
            this.previous = previous;
        }

        public int getTotal() {
            return total;
        }

        public void setTotal(int total) {
            this.total = total;
        }
    }
}