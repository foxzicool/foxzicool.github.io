import speech_recognition as sr
from pydub import AudioSegment

def recognize_speech_from_file(audio_file_path):
    # 將 mp4 文件轉換為 wav
    sound = AudioSegment.from_file(audio_file_path, format="mp4")
    wav_path = audio_file_path.replace(".mp4", ".wav")
    sound.export(wav_path, format="wav")
    
    # 初始化識別器
    recognizer = sr.Recognizer()
    
    # 從轉換後的 wav 文件加載音頻數據
    with sr.AudioFile(wav_path) as source:
        # 聆聽文件
        audio = recognizer.record(source)
    
    # 語音識別
    try:
        # 使用 Google 的免費 Web Speech API，設定語言為中文 (zh-CN)
        text = recognizer.recognize_google(audio, language='zh-CN')
        print("Recognized text: " + text)
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")

# 指定音頻文件路徑
audio_file_path = r'C:\Users\2409\Downloads\新錄音 3.mp4'
# 調用函數
recognize_speech_from_file(audio_file_path)
