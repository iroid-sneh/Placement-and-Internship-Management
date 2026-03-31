import Notification from "../models/notification.js";
import CompanySettings from "../models/companySettings.js";

export async function createNotification({
    userId,
    type,
    title,
    message,
    link = "",
    relatedApplicationId = null,
    relatedJobId = null,
}) {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            link,
            relatedApplicationId,
            relatedJobId,
        });
        return notification;
    } catch (error) {
        console.error("Failed to create notification:", error.message);
        return null;
    }
}

export async function createNotificationForCompany(companyId, notificationData) {
    try {
        const Company = (await import("../models/company.js")).default;
        const company = await Company.findById(companyId);
        if (!company || !company.userId) return null;

        if (notificationData.type === "new_application" || notificationData.type === "application_status_updated") {
            const settings = await CompanySettings.findOne({ companyId });
            if (settings) {
                if (notificationData.type === "new_application" && !settings.notifications.applicationNotifications) {
                    return null;
                }
                if (notificationData.type === "application_status_updated" && !settings.notifications.statusUpdateNotifications) {
                    return null;
                }
            }
        }

        return createNotification({ ...notificationData, userId: company.userId });
    } catch (error) {
        console.error("Failed to create company notification:", error.message);
        return null;
    }
}

export async function getUnreadCount(userId) {
    try {
        return await Notification.countDocuments({ userId, isRead: false });
    } catch {
        return 0;
    }
}
