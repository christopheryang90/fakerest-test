import axios from "axios";
import readline from "readline";
import { URL } from "url";

// Define User and Friend types
interface Friend {
    name: string;
    hobbies: string[];
}

interface User {
    id: number;
    name: string;
    city: string;
    age: number;
    friends?: Friend[];
}

// Preprocessed city data structure
interface CityData {
    ages: number[];
    friendCounts: number[];
    users: User[];
}

// Expected output structure
interface AnalysisResult {
    average_age_per_city: Record<string, number>;
    average_friends_per_city: Record<string, number>;
    most_friends_per_city: Record<string, string>;
    most_common_first_name: string;
    most_common_hobby: string;
}

const API_URL: string = process.argv[2] || "http://test.brightsign.io:3000"; // Default if not provided


async function fetchData(url: string): Promise<void> {
    try {
        new URL(url); // Validate URL

        const response = await axios.get<string>(url, {
            timeout: 5000, // 5-second timeout
            headers: {
                "Accept": "application/json",
                "User-Agent": "MyRESTClient/1.0"
            },
            responseType: "text" // Ensure response is treated as text (NDJSON)
        });

        if (!response.data) {
            console.error("Error: Empty response from server");
            process.exit(1);
        }

        const lines = response.data.trim().split("\n"); // Split NDJSON into lines
        const validJsonObjects: User[] = [];

        for (const line of lines) {
            try {
                const jsonObject: User = JSON.parse(line);
                validJsonObjects.push(jsonObject);
            } catch {
                console.error("Warning: Skipping malformed JSON line");
            }
        }

        // Process the data
        const analysis: AnalysisResult = analyzeData(validJsonObjects);

        // Output structured JSON
        console.log(JSON.stringify(analysis, null, 2));

    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.code === "ECONNABORTED") {
                console.error("Error: Request timed out");
            } else if (error.response) {
                console.error(`Error: HTTP ${error.response.status} - ${error.response.statusText}`);
            } else {
                console.error(`Error: ${error.message}`);
            }
        } else {
            console.error(`Error: ${(error as Error).message}`);
        }
        process.exit(1);
    }
}

// Function to analyze data and return the expected JSON structure
function analyzeData(users: User[]): AnalysisResult {
    // Preprocess data by city
    const cityData: Record<string, CityData> = {};

    for (const user of users) {
        if (!user.city) continue; // Skip users without a city

        if (!cityData[user.city]) {
            cityData[user.city] = { ages: [], friendCounts: [], users: [] };
        }

        cityData[user.city].ages.push(user.age);
        cityData[user.city].friendCounts.push(user.friends ? user.friends.length : 0);
        cityData[user.city].users.push(user);
    }

    return {
        average_age_per_city: calculateAverageAgeByCity(cityData),
        average_friends_per_city: calculateAverageFriendsByCity(cityData),
        most_friends_per_city: findUserWithMostFriendsByCity(cityData),
        most_common_first_name: findMostCommonFirstName(users),
        most_common_hobby: findMostCommonHobbyAllFriends(users)
    };
}

// Calculation Functions
function calculateAverageAgeByCity(cityData: Record<string, CityData>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const city in cityData) {
        const ages = cityData[city].ages;
        result[city] = ages.length ? parseFloat((ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1)) : 0;
    }
    return result;
}

function calculateAverageFriendsByCity(cityData: Record<string, CityData>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const city in cityData) {
        const friendCounts = cityData[city].friendCounts;
        result[city] = friendCounts.length 
            ? parseFloat((friendCounts.reduce((sum, count) => sum + count, 0) / friendCounts.length).toFixed(1)) 
            : 0;
    }
    return result;
}


function findUserWithMostFriendsByCity(cityData: Record<string, CityData>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const city in cityData) {
        const users = cityData[city].users;
        if (!users.length) continue;
        
        const mostFriendsUser = users.reduce((max, user) => {
            return (user.friends?.length || 0) > (max.friends?.length || 0) ? user : max;
        }, users[0]);

        result[city] = mostFriendsUser.name;
    }
    return result;
}

function findMostCommonFirstName(users: User[]): string {
    const nameCounts: Record<string, number> = {};
    
    for (const user of users) {
        if (!user.name) continue;
        nameCounts[user.name] = (nameCounts[user.name] || 0) + 1;
    }

    return Object.entries(nameCounts).reduce((max, [name, count]) => 
        count > max.count ? { name, count } : max, { name: "", count: 0 }).name;
}

function findMostCommonHobbyAllFriends(users: User[]): string {
    const hobbyCounts: Record<string, number> = {};
    
    for (const user of users) {
        if (!user.friends) continue;
        for (const friend of user.friends) {
            for (const hobby of friend.hobbies) {
                hobbyCounts[hobby] = (hobbyCounts[hobby] || 0) + 1;
            }
        }
    }

    return Object.entries(hobbyCounts).reduce((max, [hobby, count]) => 
        count > max.count ? { hobby, count } : max, { hobby: "", count: 0 }).hobby;
}

// Run the function
fetchData(API_URL);
