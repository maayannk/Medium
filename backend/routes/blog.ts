import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'


export const blogrouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    },
    Variables:{
        userId : string
    }
}>()


blogrouter.use('/*', async (c,next)=>{
    const header = c.req.header('Authorization') || "";
    try {
        const token = await verify(header,c.env.JWT_SECRET);
    if(token && typeof token.id === 'string'){
        c.set('userId',token.id)
        await next();
    }else{
        c.status(401);
        return c.json({
            msg : "You are not logged in"
        })
    }
    } catch (error) {
        c.status(403)
        return c.json({
            msg : "You are not logged in"
        })
    }
})


blogrouter.post('/', async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL	,
    }).$extends(withAccelerate());
    
    const userId = c.get('userId');
    const body = await c.req.json();
    const blog = await prisma.post.create({
        data :{
            title : body.title,
            content : body.content,
            authorId : userId
        }
    })
   return c.json({
    msg : blog.id
   })
    
})

blogrouter.put('/',async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL	,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const blog = await prisma.post.update({
        where :{
            id : body.id
        },
        data : {
            title : body.title,
            content : body.content
        }
    })

    return c.json({
        id : blog.id
    })
})

blogrouter.get('/bulk', async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL	,
    }).$extends(withAccelerate());

   try {
    const blogs = await prisma.post.findMany()

    return c.json({
        blogs
    })
   } catch (error) {
        c.status(411)
        return c.json({
            error : "Error while getting the blogs"
        })
   }
})

blogrouter.get('/:id',async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL	,
    }).$extends(withAccelerate());

    const id = c.req.param("id");
   try {
    const blog = await prisma.post.findFirst({
        where : {
            id : id
        }
       })
    
       return c.json({
        blog
       })
    
   } catch (error) {
        c.status(411);
        return c.json({
            error : "Can't get the blog"
        })
   }
})  


