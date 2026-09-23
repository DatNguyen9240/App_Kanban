package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

// WSEvent represents the payload sent over WebSocket
type WSEvent struct {
	Event    string      `json:"event"`     // e.g. "CARD_MOVED", "CARD_CREATED", "CARD_UPDATED", "CARD_DELETED"
	BoardID  string      `json:"board_id"`  // target room
	SenderID string      `json:"sender_id"` // client who triggered
	Payload  interface{} `json:"payload"`
}

// Hub maintains the set of active clients and broadcasts messages to the rooms.
type Hub struct {
	// Registered clients partitioned by BoardID (Room)
	rooms      map[string]map[*Client]bool
	broadcast  chan *WSEvent
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

var GlobalHub *Hub

func InitHub() *Hub {
	GlobalHub = &Hub{
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan *WSEvent, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
	go GlobalHub.Run()
	return GlobalHub
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.rooms[client.BoardID] == nil {
				h.rooms[client.BoardID] = make(map[*Client]bool)
			}
			h.rooms[client.BoardID][client] = true
			h.mu.Unlock()
			log.Printf("[WS] Client registered to board: %s (total in room: %d)", client.BoardID, len(h.rooms[client.BoardID]))

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.rooms[client.BoardID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.rooms, client.BoardID)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("[WS] Client unregistered from board: %s", client.BoardID)

		case event := <-h.broadcast:
			h.mu.RLock()
			clients := h.rooms[event.BoardID]
			data, err := json.Marshal(event)
			if err != nil {
				log.Printf("[WS] Failed to marshal event: %v", err)
				h.mu.RUnlock()
				continue
			}

			for client := range clients {
				// Don't echo back to the sender if sender specified
				if client.UserID != "" && client.UserID == event.SenderID {
					continue
				}
				select {
				case client.send <- data:
				default:
					close(client.send)
					delete(clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast sends an event to all clients connected to a board room
func (h *Hub) Broadcast(event *WSEvent) {
	h.broadcast <- event
}
