package com.leejanghan.aimyeoneuri

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * F2-3 통화 중 위험 발화 경보
 * SpeechRecognizer로 MIC 오디오만 온디바이스 처리 — 저장·전송 없음 (ADR-008 준수)
 */
class CallKeywordModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CallKeyword"

    private val mainHandler = Handler(Looper.getMainLooper())
    private var recognizer: SpeechRecognizer? = null
    @Volatile private var isListening = false

    private val KEYWORDS = listOf(
        "계좌", "계좌번호", "통장번호", "송금", "이체",
        "인증번호", "인증 번호", "앱 설치", "설치해", "설치하세요",
        "검찰", "경찰청", "금감원", "국세청", "법원",
        "범죄", "명의도용", "체포", "구속", "사기"
    )

    @ReactMethod
    fun startListening() {
        mainHandler.post {
            if (isListening) return@post
            if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) return@post
            isListening = true
            startRecognitionCycle()
        }
    }

    @ReactMethod
    fun stopListening() {
        mainHandler.post {
            isListening = false
            recognizer?.destroy()
            recognizer = null
        }
    }

    private fun startRecognitionCycle() {
        if (!isListening) return
        recognizer?.destroy()
        recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
        recognizer?.setRecognitionListener(object : RecognitionListener {
            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                matches?.firstOrNull()?.let { text ->
                    val hit = KEYWORDS.firstOrNull { kw -> text.contains(kw) }
                    if (hit != null) emitKeyword(hit)
                }
                if (isListening) mainHandler.postDelayed({ startRecognitionCycle() }, 300)
            }
            override fun onError(error: Int) {
                if (isListening) mainHandler.postDelayed({ startRecognitionCycle() }, 1500)
            }
            override fun onPartialResults(p: Bundle?) {}
            override fun onEndOfSpeech() {}
            override fun onReadyForSpeech(p: Bundle?) {}
            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(v: Float) {}
            override fun onBufferReceived(b: ByteArray?) {}
            override fun onEvent(t: Int, p: Bundle?) {}
        })
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ko-KR")
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        recognizer?.startListening(intent)
    }

    private fun emitKeyword(keyword: String) {
        val params = Arguments.createMap().apply { putString("keyword", keyword) }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("KeywordDetected", params)
    }

    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}

    override fun invalidate() {
        isListening = false
        mainHandler.post { recognizer?.destroy(); recognizer = null }
        super.invalidate()
    }
}
