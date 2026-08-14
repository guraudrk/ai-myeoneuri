package com.leejanghan.aimyeoneuri

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.TelephonyManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallStateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CallState"

    private var receiver: BroadcastReceiver? = null
    private var wasOffhook = false

    @ReactMethod
    fun startListening() {
        if (receiver != null) return
        receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
                val emitter = reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                when (state) {
                    TelephonyManager.EXTRA_STATE_RINGING -> {
                        val number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: ""
                        emitter.emit("IncomingCall", Arguments.createMap().apply { putString("number", number) })
                    }
                    TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                        wasOffhook = true
                        emitter.emit("CallActive", Arguments.createMap())
                    }
                    TelephonyManager.EXTRA_STATE_IDLE -> {
                        if (wasOffhook) emitter.emit("CallEnded", Arguments.createMap())
                        wasOffhook = false
                    }
                }
            }
        }
        val filter = IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            reactContext.registerReceiver(receiver, filter)
        }
    }

    @ReactMethod
    fun stopListening() {
        receiver?.let {
            try { reactContext.unregisterReceiver(it) } catch (_: Exception) {}
            receiver = null
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun invalidate() {
        stopListening()
        super.invalidate()
    }
}
