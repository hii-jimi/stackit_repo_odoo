import cv2
import mediapipe as mp
import numpy as np
import pyttsx3
import time
import threading
import speech_recognition as sr

# Initialize text-to-speech engine
tts_engine = pyttsx3.init()
tts_engine.setProperty('rate', 150)

# Speech recognition function running in a separate thread
def recognize_speech():
    recognizer = sr.Recognizer()
    mic = sr.Microphone()
    with mic as source:
        recognizer.adjust_for_ambient_noise(source)
    while True:
        with mic as source:
            print("Listening for speech...")
            audio = recognizer.listen(source)
        try:
            text = recognizer.recognize_google(audio)
            print(f"Recognized speech: {text}")
            tts_engine.say(text)
            tts_engine.runAndWait()
        except sr.UnknownValueError:
            print("Could not understand audio")
        except sr.RequestError as e:
            print(f"Speech recognition error; {e}")

# Simple gesture classifier placeholder
def classify_gesture(hand_landmarks):
    tips_ids = [4, 8, 12, 16, 20]
    fingers = []

    if hand_landmarks.landmark[tips_ids[0]].x < hand_landmarks.landmark[tips_ids[0] - 1].x:
        fingers.append(1)
    else:
        fingers.append(0)

    for id in range(1, 5):
        if hand_landmarks.landmark[tips_ids[id]].y < hand_landmarks.landmark[tips_ids[id] - 2].y:
            fingers.append(1)
        else:
            fingers.append(0)

    total_fingers = sum(fingers)

    gesture_map = {
        0: "Fist",
        1: "One",
        2: "Two",
        3: "Three",
        4: "Four",
        5: "Five"
    }
    return gesture_map.get(total_fingers, "Unknown")

def main():
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    prev_gesture = None
    last_spoken_time = 0

    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter('sign_tracker_recording.avi', fourcc, 20.0, (640, 480))

    # Start speech recognition thread
    speech_thread = threading.Thread(target=recognize_speech, daemon=True)
    speech_thread.start()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to capture frame.")
            break

        frame = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = hands.process(frame_rgb)

        gesture_text = ""

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                gesture = classify_gesture(hand_landmarks)
                gesture_text += gesture + " "

                current_time = time.time()
                if gesture != prev_gesture and (current_time - last_spoken_time) > 2:
                    tts_engine.say(gesture)
                    tts_engine.runAndWait()
                    prev_gesture = gesture
                    last_spoken_time = current_time

        cv2.putText(frame, gesture_text.strip(), (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        out.write(frame)

        cv2.imshow('Advanced Live Sign Tracker', frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    out.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
