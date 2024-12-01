import { instagramSessionService } from "./instagramSessionService";
import { userInstagramService } from "./userInstagramService";
import { IgApiClient } from "instagram-private-api";

interface userLogin {
    name: string
    username: string
    password: string
    status: string
}

interface dataLogin {
    id: number
    username: string
    password: string
}

interface search {
    defaultAccount: string
    query: string
}

const handleLogin = async (dataLogin: userLogin) => {
    const resLogin = await userInstagramService.create(dataLogin)
    return resLogin
}

const getAllUsers = async () => {
    const resAllUsers = await userInstagramService.findAll()
    return resAllUsers
}

const loginPrivate = async (userLogin: dataLogin) => {
    const userIgId = userLogin.id
    const ig = new IgApiClient()
    ig.state.generateDevice(userLogin.username)

    await ig.account.login(userLogin.username, userLogin.password)
    const serialized = await ig.state.serialize()
    const cookieJar = await ig.state.serializeCookieJar()
    const serializedCookieJar = JSON.stringify(cookieJar)
    const data = {
        userId: userIgId,
        session: JSON.stringify(serialized),
        cookieJar: serializedCookieJar
    }
    const checkUsersSession = await instagramSessionService.findByUserId(userIgId)
    if(checkUsersSession){
        const resSessionIg = await instagramSessionService.update(userIgId,data)
    }else{
        const createSession = await instagramSessionService.create(data)
    }
    const statusUpdate = await userInstagramService.updateStatus(userIgId, 'login')
    console.log(statusUpdate)
    return ({success: true})
}

const logoutUsers = async (id: number) => {
    const logoutUsers = await userInstagramService.updateStatus(id, 'logout')
    console.log(logoutUsers)
    return ({success: true})
}

const deleteUsers = async (id: number) => {
    const resDeleteUsers = await userInstagramService.delete(id)
    return ({success: true})
}

const search = async (dataSearch: search) => {
    const ig = new IgApiClient()
    const searchAll = await userInstagramService.findAll()
    const macthed = searchAll.find(users => users.name === dataSearch.defaultAccount)
    if(macthed && macthed.session){
        try{
            await ig.state.deserialize(JSON.parse(macthed.session?.session))
            await ig.state.deserializeCookieJar(JSON.parse(macthed.session?.cookieJar))
    
            const query = dataSearch.query
             // Lakukan pencarian paralel
             const [users, hashtags, locations] = await Promise.all([
                ig.search.users(query),
                ig.search.tags(query),
                ig.search.location(0, 0, query),
            ]);
            return {
                success: true,
                data: {
                    locations,
                    hashtags,
                    users,
                },
            }
        }catch(error){
            return {
                success: false,
                error: 'Search failed.',
            };
        }
    }
}

const instagramHandle = {
    invoke: [
        {
            name: "handleLogin",
            togo: handleLogin
        },
        {
            name: "getAllUsersInstagram",
            togo: getAllUsers
        },
        {
            name: "loginPrivate",
            togo: loginPrivate
        },
        {
            name: "logoutUsers",
            togo: logoutUsers
        },
        {
            name: "deleteUsersIg",
            togo: deleteUsers
        },
        {
            name: "search",
            togo: search
        }
    ]
}

export {instagramHandle}