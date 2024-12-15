import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify } from 'hono/jwt'



export const userrouter = new Hono<{
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
}>()


userrouter.post('/signup',async (c)=>{
    const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL	,
        }).$extends(withAccelerate());
    
        const body = await c.req.json()
    
      try {
        const user = await prisma.user.create({
          data : {
            name : body.name,
            email : body.email,
            password : body.password
          }
        })
        const token = await sign ({id : user.id},c.env.JWT_SECRET);
    
        return c.json({
          jwt : token,
        })
    
      } catch (error) {
        c.status(403);
        return c.json({
          error : "Error while signing up"
        })
      }
        
})



userrouter.post('/signin',async (c)=>{
    const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL	,
	}).$extends(withAccelerate());

  const body = await c.req.json();

  try {
    const user = await prisma.user.findUnique({
      where : {
        email : body.email,
        password : body.password
      }
    })
  
    if(!user){
      c.status(403);
      return c.json({
        error : "User not found"
      })
    }
  
    const token = await sign({id : user.id},c.env.JWT_SECRET);
  
    return c.json({
      jwt : token
    })
  } catch (error) {
    c.status(411)
    return c.json({
      error : "Error while signing in"
    })
  }
})