package com.leejanghan.aimyeoneuri

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Calendar

class UsageStatsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "UsageStats"

    @ReactMethod
    fun hasPermission(promise: Promise) {
        try {
            val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                reactApplicationContext.packageName
            )
            promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestPermission(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // 오늘 자정부터 지금까지의 사용 통계를 반환한다.
    // firstUsageTime: 첫 앱 포그라운드 진입 시각 (ms, 미사용 시 -1)
    // totalForegroundMs: 총 포그라운드 시간 (ms)
    @ReactMethod
    fun getDailyUsage(promise: Promise) {
        try {
            val manager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE)
                as UsageStatsManager

            val cal = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val startTime = cal.timeInMillis
            val endTime = System.currentTimeMillis()

            val events = manager.queryEvents(startTime, endTime)
            val ev = UsageEvents.Event()

            var firstUsageTime = -1L
            var totalForegroundMs = 0L
            val resumeMap = mutableMapOf<String, Long>()

            while (events.hasNextEvent()) {
                events.getNextEvent(ev)
                when (ev.eventType) {
                    UsageEvents.Event.ACTIVITY_RESUMED -> {
                        if (firstUsageTime < 0) firstUsageTime = ev.timeStamp
                        resumeMap[ev.packageName] = ev.timeStamp
                    }
                    UsageEvents.Event.ACTIVITY_PAUSED -> {
                        val resumeAt = resumeMap.remove(ev.packageName)
                        if (resumeAt != null) {
                            totalForegroundMs += ev.timeStamp - resumeAt
                        }
                    }
                }
            }
            // 현재 포그라운드 중인 앱의 시간도 누적
            for ((_, ts) in resumeMap) {
                totalForegroundMs += endTime - ts
            }

            val result = Arguments.createMap()
            result.putDouble("firstUsageTime", firstUsageTime.toDouble())
            result.putDouble("totalForegroundMs", totalForegroundMs.toDouble())
            result.putDouble("checkedAt", endTime.toDouble())
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("USAGE_STATS_ERROR", e.message)
        }
    }
}
