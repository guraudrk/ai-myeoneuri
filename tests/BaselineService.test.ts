import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  recordDailyUsage,
  detectAnomaly,
  markAnomalyDismissed,
  isAnomalyDismissed,
  isAnomalyDetectionEnabled,
  setAnomalyDetectionEnabled,
} from "@/features/anomaly/BaselineService";

describe("BaselineService", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("isAnomalyDetectionEnabled / setAnomalyDetectionEnabled", () => {
    it("기본값은 true다", async () => {
      expect(await isAnomalyDetectionEnabled()).toBe(true);
    });

    it("false로 설정하면 false를 반환한다", async () => {
      await setAnomalyDetectionEnabled(false);
      expect(await isAnomalyDetectionEnabled()).toBe(false);
    });

    it("다시 true로 설정하면 true를 반환한다", async () => {
      await setAnomalyDetectionEnabled(false);
      await setAnomalyDetectionEnabled(true);
      expect(await isAnomalyDetectionEnabled()).toBe(true);
    });
  });

  describe("markAnomalyDismissed / isAnomalyDismissed", () => {
    it("dismiss 전에는 false다", async () => {
      expect(await isAnomalyDismissed("2026-08-14")).toBe(false);
    });

    it("dismiss 후에는 true다", async () => {
      await markAnomalyDismissed("2026-08-14");
      expect(await isAnomalyDismissed("2026-08-14")).toBe(true);
    });

    it("다른 날짜는 영향받지 않는다", async () => {
      await markAnomalyDismissed("2026-08-14");
      expect(await isAnomalyDismissed("2026-08-13")).toBe(false);
    });
  });

  describe("detectAnomaly", () => {
    async function buildBaseline(count = 14) {
      for (let i = 0; i < count; i++) {
        const date = `2026-08-${String(i + 1).padStart(2, "0")}`;
        await recordDailyUsage({ date, firstUsageHour: 8, totalForegroundMin: 60 });
      }
    }

    it("학습 데이터 14일 미만이면 none을 반환한다", async () => {
      await recordDailyUsage({ date: "2026-08-01", firstUsageHour: 8, totalForegroundMin: 60 });
      const level = await detectAnomaly({ date: "2026-08-02", firstUsageHour: 15, totalForegroundMin: 10 });
      expect(level).toBe("none");
    });

    it("평소와 동일한 패턴이면 none을 반환한다", async () => {
      await buildBaseline();
      const level = await detectAnomaly({ date: "2026-08-15", firstUsageHour: 8, totalForegroundMin: 55 }, 9);
      expect(level).toBe("none");
    });

    it("첫 사용이 평소보다 3시간 이상 늦으면 mild를 반환한다", async () => {
      await buildBaseline();
      const level = await detectAnomaly({ date: "2026-08-15", firstUsageHour: 12, totalForegroundMin: 55 }, 13);
      expect(level).toBe("mild");
    });

    it("폰을 안 켰고 평소 시각보다 4시간 이상 지났으면 significant를 반환한다", async () => {
      await buildBaseline();
      // avgFirstHour = 8, checkHour = 13 → 13 > 8 + 4
      const level = await detectAnomaly({ date: "2026-08-15", firstUsageHour: null, totalForegroundMin: 0 }, 13);
      expect(level).toBe("significant");
    });

    it("사용 시간이 평균의 30% 미만이면 mild를 반환한다", async () => {
      await buildBaseline(); // avg 60분
      const level = await detectAnomaly({ date: "2026-08-15", firstUsageHour: 8, totalForegroundMin: 10 }, 9);
      expect(level).toBe("mild");
    });
  });
});
