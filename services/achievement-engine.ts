import type {
  CustomAchievementRule,
  CustomAchievementCondition,
  AchievementEvaluation,
  AchievementStats,
  Achievement,
  EarnedAchievement,
} from "../types/achievement"
import type { User } from "../types/user"
import { achievementTemplates } from "../data/achievement-templates"

export class AchievementEngine {
  private rules: CustomAchievementRule[] = []
  private achievements: Achievement[]
  private evaluationCache = new Map<string, AchievementEvaluation>()

  constructor(rules: CustomAchievementRule[] = []) {
    this.rules = rules.filter((rule) => rule.isActive)
    this.achievements = [...achievementTemplates]
  }

  updateRules(rules: CustomAchievementRule[]) {
    this.rules = rules.filter((rule) => rule.isActive)
    this.evaluationCache.clear()
  }

  addCustomAchievement(achievement: Achievement) {
    this.achievements.push(achievement)
  }

  async evaluateUser(user: User, sheetsData?: any[]): Promise<AchievementEvaluation[]> {
    const evaluations: AchievementEvaluation[] = []

    for (const rule of this.rules) {
      const evaluation = await this.evaluateRule(user, rule, sheetsData)
      evaluations.push(evaluation)
    }

    return evaluations
  }

  async evaluateAllUsers(users: User[], sheetsData?: any[]): Promise<Map<string, AchievementEvaluation[]>> {
    const results = new Map<string, AchievementEvaluation[]>()

    for (const user of users) {
      const evaluations = await this.evaluateUser(user, sheetsData)
      results.set(user.id, evaluations)
    }

    return results
  }

  private async evaluateRule(
    user: User,
    rule: CustomAchievementRule,
    sheetsData?: any[],
  ): Promise<AchievementEvaluation> {
    const cacheKey = `${user.id}_${rule.id}_${Date.now()}`

    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey)!
    }

    const conditionResults = await Promise.all(
      rule.conditions.map((condition) => this.evaluateCondition(user, condition, sheetsData)),
    )

    const allConditionsMet = conditionResults.every((result) => result.met)
    const averageProgress = conditionResults.reduce((sum, result) => sum + result.progress, 0) / conditionResults.length

    const evaluation: AchievementEvaluation = {
      userId: user.id,
      userName: user.name,
      ruleId: rule.id,
      ruleName: rule.name,
      achieved: allConditionsMet,
      progress: averageProgress,
      rewards: allConditionsMet ? rule.rewards : undefined,
      evaluatedAt: new Date().toISOString(),
      conditions: conditionResults.map((result, index) => ({
        conditionId: rule.conditions[index].id,
        met: result.met,
        actualValue: result.actualValue,
        requiredValue: result.requiredValue,
      })),
    }

    this.evaluationCache.set(cacheKey, evaluation)
    return evaluation
  }

  private async evaluateCondition(
    user: User,
    condition: CustomAchievementCondition,
    sheetsData?: any[],
  ): Promise<{ met: boolean; progress: number; actualValue: number; requiredValue: number }> {
    const actualValue = await this.getFieldValue(user, condition.field, condition.timeframe, sheetsData)
    const requiredValue = condition.value
    const secondValue = condition.secondValue

    let met = false
    let progress = 0

    switch (condition.operator) {
      case "greater_than":
        met = actualValue > requiredValue
        progress = Math.min(actualValue / requiredValue, 1)
        break
      case "greater_than_equal":
        met = actualValue >= requiredValue
        progress = Math.min(actualValue / requiredValue, 1)
        break
      case "less_than":
        met = actualValue < requiredValue
        progress = actualValue < requiredValue ? 1 : Math.max(0, 1 - (actualValue - requiredValue) / requiredValue)
        break
      case "less_than_equal":
        met = actualValue <= requiredValue
        progress = actualValue <= requiredValue ? 1 : Math.max(0, 1 - (actualValue - requiredValue) / requiredValue)
        break
      case "equals":
        met = actualValue === requiredValue
        progress =
          actualValue === requiredValue ? 1 : Math.max(0, 1 - Math.abs(actualValue - requiredValue) / requiredValue)
        break
      case "between":
        if (secondValue !== undefined) {
          met = actualValue >= requiredValue && actualValue <= secondValue
          if (met) {
            progress = 1
          } else if (actualValue < requiredValue) {
            progress = actualValue / requiredValue
          } else {
            progress = Math.max(0, 1 - (actualValue - secondValue) / secondValue)
          }
        }
        break
    }

    return {
      met,
      progress: Math.max(0, Math.min(1, progress)),
      actualValue,
      requiredValue,
    }
  }

  private async getFieldValue(user: User, field: string, timeframe: string, sheetsData?: any[]): Promise<number> {
    // Get user's data from sheets if available
    const userSheetData = sheetsData?.find((data) => data.name.toLowerCase() === user.name.toLowerCase())

    switch (field) {
      case "signups":
        return this.getTimeframeValue(user.currentSignups, userSheetData?.signups, timeframe)
      case "revenue":
        return this.getTimeframeValue(user.currentRevenue, userSheetData?.revenue, timeframe)
      case "streak":
        return user.streak || 0
      case "improvement_percentage":
        return this.calculateImprovement(user, userSheetData, timeframe)
      case "team_rank":
        return this.calculateTeamRank(user, sheetsData)
      case "custom":
        // For custom metrics, you would implement your own logic
        return 0
      default:
        return 0
    }
  }

  private getTimeframeValue(currentValue: number, sheetData: any, timeframe: string): number {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    switch (timeframe) {
      case "current_month":
        if (sheetData) {
          const monthNames = [
            "january",
            "february",
            "march",
            "april",
            "may",
            "june",
            "july",
            "august",
            "september",
            "october",
            "november",
            "december",
          ]
          const currentMonthName = monthNames[currentMonth]
          return sheetData[currentMonthName] || 0
        }
        return currentValue
      case "current_year":
      case "all_time":
        return sheetData?.total || currentValue
      case "last_month":
        if (sheetData) {
          const monthNames = [
            "january",
            "february",
            "march",
            "april",
            "may",
            "june",
            "july",
            "august",
            "september",
            "october",
            "november",
            "december",
          ]
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
          const lastMonthName = monthNames[lastMonth]
          return sheetData[lastMonthName] || 0
        }
        return 0
      default:
        return currentValue
    }
  }

  private calculateImprovement(user: User, sheetData: any, timeframe: string): number {
    if (!sheetData) return 0

    const currentMonth = new Date().getMonth()
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ]

    if (timeframe === "current_month" && currentMonth > 0) {
      const currentMonthName = monthNames[currentMonth]
      const lastMonthName = monthNames[currentMonth - 1]

      const currentValue = (sheetData.signups?.[currentMonthName] || 0) + (sheetData.revenue?.[currentMonthName] || 0)
      const lastValue = (sheetData.signups?.[lastMonthName] || 0) + (sheetData.revenue?.[lastMonthName] || 0)

      if (lastValue === 0) return currentValue > 0 ? 100 : 0
      return ((currentValue - lastValue) / lastValue) * 100
    }

    return 0
  }

  private calculateTeamRank(user: User, sheetsData?: any[]): number {
    if (!sheetsData) return 1

    // Sort users by total performance (signups + revenue)
    const userPerformances = sheetsData
      .map((data) => ({
        name: data.name,
        total: (data.signups?.total || 0) + (data.revenue?.total || 0),
      }))
      .sort((a, b) => b.total - a.total)

    const userIndex = userPerformances.findIndex((perf) => perf.name.toLowerCase() === user.name.toLowerCase())

    return userIndex >= 0 ? userIndex + 1 : userPerformances.length + 1
  }

  generateStats(evaluations: Map<string, AchievementEvaluation[]>): AchievementStats {
    const allEvaluations = Array.from(evaluations.values()).flat()
    const achievedEvaluations = allEvaluations.filter((evaluation) => evaluation.achieved)

    const totalEarnings = achievedEvaluations.reduce((sum, evaluation) => {
      return sum + (evaluation.rewards?.bonusAmount || 0)
    }, 0)

    const userStats = new Map<string, { achievementCount: number; totalRewards: number }>()
    const ruleStats = new Map<
      string,
      { achievementCount: number; totalRewards: number; totalProgress: number; evaluationCount: number }
    >()

    allEvaluations.forEach((evaluation) => {
      // User stats
      const userStat = userStats.get(evaluation.userId) || { achievementCount: 0, totalRewards: 0 }
      if (evaluation.achieved) {
        userStat.achievementCount++
        userStat.totalRewards += evaluation.rewards?.bonusAmount || 0
      }
      userStats.set(evaluation.userId, userStat)

      // Rule stats
      const ruleStat = ruleStats.get(evaluation.ruleId) || {
        achievementCount: 0,
        totalRewards: 0,
        totalProgress: 0,
        evaluationCount: 0,
      }
      if (evaluation.achieved) {
        ruleStat.achievementCount++
        ruleStat.totalRewards += evaluation.rewards?.bonusAmount || 0
      }
      ruleStat.totalProgress += evaluation.progress
      ruleStat.evaluationCount++
      ruleStats.set(evaluation.ruleId, ruleStat)
    })

    const topPerformers = Array.from(userStats.entries())
      .map(([userId, stats]) => ({
        userId,
        userName: allEvaluations.find((evaluation) => evaluation.userId === userId)?.userName || "",
        achievementCount: stats.achievementCount,
        totalRewards: stats.totalRewards,
      }))
      .sort((a, b) => b.achievementCount - a.achievementCount)
      .slice(0, 10)

    const rulePerformance = Array.from(ruleStats.entries())
      .map(([ruleId, stats]) => ({
        ruleId,
        ruleName: allEvaluations.find((evaluation) => evaluation.ruleId === ruleId)?.ruleName || "",
        achievementCount: stats.achievementCount,
        totalRewards: stats.totalRewards,
        averageProgress: stats.totalProgress / stats.evaluationCount,
      }))
      .sort((a, b) => b.achievementCount - a.achievementCount)

    return {
      totalRules: this.rules.length,
      activeRules: this.rules.filter((rule) => rule.isActive).length,
      totalEarnings,
      totalAchievements: achievedEvaluations.length,
      topPerformers,
      rulePerformance,
    }
  }

  checkAchievements(user: User): EarnedAchievement[] {
    const newlyEarned: EarnedAchievement[] = []

    this.achievements.forEach((achievement) => {
      const hasAlreadyEarned = user.achievements.some((ea) => ea.id === achievement.id && !achievement.isRepeatable)
      if (hasAlreadyEarned) {
        return
      }

      let isEarned = false
      switch (achievement.criteria.metric) {
        case "revenue":
          if (user.currentRevenue >= achievement.criteria.value) {
            isEarned = true
          }
          break
        case "signups":
          if (user.currentSignups >= achievement.criteria.value) {
            isEarned = true
          }
          break
        case "streak":
          if (user.streak >= achievement.criteria.value) {
            isEarned = true
          }
          break
      }

      if (isEarned) {
        newlyEarned.push({
          ...achievement,
          earnedDate: new Date().toISOString(),
          userId: user.id,
        })
      }
    })

    return newlyEarned
  }
}
