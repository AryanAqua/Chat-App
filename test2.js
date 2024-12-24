<div className="p-4 border-b">
          <div className="space-y-4">
            {/* Opponent Stream */}
            <div className="relative bg-gray-100 rounded-lg aspect-video">
              <ReactPlayer
                className="w-full h-full object-cover rounded-lg"
                playing
                muted
                height="100px"
                width="200px"
                url={remoteStream}
              />
              <div className="absolute top-2 left-2">
                <span className="bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded-lg text-sm">
                  Opponent (1800)
                </span>
                <button onClick={sendStreams}>Send Stream</button>
              </div>
            </div>

            {/* Your Stream */}
            <div className="relative bg-gray-100 rounded-lg aspect-video">
              <ReactPlayer
                className="w-full h-full object-cover rounded-lg"
                playing
                muted
                height="100px"
                width="200px"
                url={myStream}
              />
              <div className="absolute top-2 left-2">
                <span className="bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded-lg text-sm">
                  You (1650)
                </span>
                <button onClick={handleCallUser}>CALL</button>
              </div>
              <div className="absolute bottom-2 right-2 flex space-x-2">
                <button
                  onClick={toggleAudio}
                  className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"
                >
                  {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button
                  onClick={toggleVideo}
                  className="p-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700"
                >
                  {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>