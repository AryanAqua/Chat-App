class PeerService {
  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    // Add ICE candidate handling
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the candidate to the remote peer
        // You'll need to implement this through your signaling server
        console.log("New ICE candidate:", event.candidate);
      }
    };

    // Log state changes
    this.peer.onconnectionstatechange = () => {
      console.log("Connection state:", this.peer.connectionState);
    };

    this.peer.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.peer.iceConnectionState);
    };
  }

  async getAnswer(offer) {
    try {
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(new RTCSessionDescription(answer));
      return answer;
    } catch (error) {
      console.error("Error in getAnswer:", error);
      throw error;
    }
  }

  async setLocalDescription(ans) {
    try {
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
    } catch (error) {
      console.error("Error in setLocalDescription:", error);
      throw error;
    }
  }

  async getOffer() {
    try {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(new RTCSessionDescription(offer));
      return offer;
    } catch (error) {
      console.error("Error in getOffer:", error);
      throw error;
    }
  }
}

export default new PeerService();