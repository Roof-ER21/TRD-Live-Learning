import {
  GoogleSheetsService,
  type SignupData,
  type RevenueData,
  type MonthlySignupData,
  type YearlyRevenueData,
} from "../lib/google-sheets"
import type { User } from "../types/user"

export class DataSyncService {
  private googleSheetsService: GoogleSheetsService

  constructor(apiKey: string, spreadsheetId: string) {
    this.googleSheetsService = new GoogleSheetsService(apiKey, spreadsheetId)
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return this.googleSheetsService.testConnection()
  }

  async getSheetData(): Promise<{
    signups: SignupData[]
    revenue: RevenueData[]
  }> {
    try {
      console.log("🔄 Fetching data from Google Sheets...")

      const [signups, revenue] = await Promise.all([
        this.googleSheetsService.getSignupData(),
        this.googleSheetsService.getRevenueData(),
      ])

      console.log(`📊 Fetched ${signups.length} signup records and ${revenue.length} revenue records`)

      return { signups, revenue }
    } catch (error) {
      console.error("❌ Error in getSheetData:", error)
      return { signups: [], revenue: [] }
    }
  }

  async getVideoDisplayData(): Promise<{
    monthlySignupLeaders: MonthlySignupData[]
    yearlyRevenueLeaders: YearlyRevenueData[]
  }> {
    return this.googleSheetsService.getVideoDisplayData()
  }

  async syncUsersWithSheets(existingUsers: User[]): Promise<User[]> {
    try {
      const { signups, revenue } = await this.getSheetData()

      // Create a map of existing users by name for faster lookup
      const userMap = new Map<string, User>()
      existingUsers.forEach((user) => {
        userMap.set(user.name.toLowerCase(), user)
      })

      // Get all unique names from sheets
      const allNames = new Set<string>()
      signups.forEach((s) => allNames.add(s.name))
      revenue.forEach((r) => allNames.add(r.name))

      const updatedUsers: User[] = []

      // Process each name from sheets
      Array.from(allNames).forEach((name, index) => {
        const signupData = signups.find((s) => s.name === name)
        const revenueData = revenue.find((r) => r.name === name)

        const existingUser = userMap.get(name.toLowerCase())

        if (existingUser) {
          // Update existing user
          updatedUsers.push({
            ...existingUser,
            currentSignups: signupData?.total || 0,
            currentRevenue: revenueData?.total || 0,
          })
        } else {
          // Create new user
          const newUser: User = {
            id: `user-${Date.now()}-${index}`,
            name,
            email: `${name.toLowerCase().replace(/\s+/g, ".")}@roofer.com`,
            role: "sales_rep",
            profilePicture: "/placeholder.svg",
            bio: "Sales Representative",
            teamId: "team-1",
            joinDate: new Date().toISOString(),
            revenueGoal: 300000,
            monthlySignupGoal: 15,
            currentRevenue: revenueData?.total || 0,
            currentSignups: signupData?.total || 0,
            achievements: [],
            streak: 0,
            isActive: true,
            lastLogin: new Date().toISOString(),
          }
          updatedUsers.push(newUser)
        }
      })

      console.log(`✅ Synced ${updatedUsers.length} users with Google Sheets data`)
      return updatedUsers
    } catch (error) {
      console.error("❌ Error syncing users with sheets:", error)
      return existingUsers // Return existing users if sync fails
    }
  }

  startAutoSync(users: User[], onUpdate: (users: User[]) => void, intervalHours = 24): NodeJS.Timeout {
    const intervalMs = intervalHours * 60 * 60 * 1000

    console.log(`🔄 Starting auto-sync every ${intervalHours} hours`)

    return setInterval(async () => {
      try {
        console.log("🔄 Auto-sync triggered...")
        const updatedUsers = await this.syncUsersWithSheets(users)
        onUpdate(updatedUsers)
        console.log("✅ Auto-sync completed successfully")
      } catch (error) {
        console.error("❌ Auto-sync failed:", error)
      }
    }, intervalMs)
  }
}
