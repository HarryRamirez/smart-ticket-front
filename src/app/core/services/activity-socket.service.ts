import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ActivitySocketService {

    socket!: WebSocket;
    activitySubject = new Subject<any>();

  connect(projectId: number) {

    this.socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/activities/${projectId}/`
    );

    
    this.socket.onopen = () => {
      console.log('WEBSOCKET CONECTADO');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('MENSAJE:', event.data);
      this.activitySubject.next(data);
    };

    this.socket.onclose = () => {
      console.log('WEBSOCKET CERRADO');
    };

    this.socket.onerror = (error) => {
      console.log('ERROR WEBSOCKET:', error);
    };
  }
    disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }
}
