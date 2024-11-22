const User = require('../models/User')

const self = module.exports

self.create = async (body) => {
    let user
    user = await User.findOne({email: body.email}).lean()

    if(user){
        throw {
            code: 404,
            title: 'Upss!',
            detail: '',
            suggestion: 'El correo ya se encuentra resgitrado',
            error: new Error()
        }
    }

    user = new User(body)
    user.createdAt = (new Date()).getTime()
    user.status = body?.status ? body?.status : 'Activo'
 
    delete user.pwd
    user.data.changePwd = false
    await user.save()

    return user
}

self.update = async (USER_ID, body) => {
    const _id = USER_ID
    const user = await User.findOne({ _id }).countDocuments().lean()

    if (!user) {
        throw {
            code: 404,
            title: 'Upss!',
            detail: 'No se encontró el elemento',
            suggestion: 'Verifica que el usuario aun este activo en la plataforma',
            error: new Error()
        }
    }

    if (body.phone) {
        await User.updateOne({ _id }, { 'validateKey.validatePhone.validCodePhone': false })
    }

    body.lastUpdate = (new Date()).getTime()
    const result = await User.updateOne({ _id }, { $set: body })

    return result
}

self.status = async (USER_ID, body) => {
    const _id = USER_ID
    const user = await User.findOne({ _id })

    if (!user) {
        throw {
            code: 404,
            title: 'Upss!',
            detail: 'No se encontró el elemento',
            suggestion: 'Verifica que el usuario aun este activo en la plataforma',
            error: new Error()
        }
    }

    user.status = body.status
    user.lastUpdate = (new Date()).getTime()

    const result = await user.save()

    return result 
}

self.updatepassword = async (body, USER_ID) => {
    let user
    user = User(body)
    const _id = USER_ID

    user = await User.findOne({ _id })

    if (!user) {
        throw {
            code: 404,
            title: 'Upss!',
            detail: 'No se encontró el elemento',
            suggestion: 'Verifica que el usuario aun este activo en la plataforma',
            error: new Error()
        }
    }

    user.pwd = body.pwd
    user.lastUpdate = (new Date()).getTime()

    const result = await user.save()

    return result 
}

self.addTimeToken = async (req, res) => {
    try {
        const userTokens = await User.findOne(
            { "tokens.token": req.params.TOKEN, status: "Activo" },
            { tokens: 1 }
          );
          
          if (userTokens) {
            const tokenObject = userTokens.tokens.find(t => t.token === req.params.TOKEN);
          
            if (tokenObject) {
              tokenObject.dateEnd = Date.now() + process.env.SESSION_TIME * 60 * 1000;
              // Guarda los cambios en la base de datos
              await User.updateOne(
                { _id: userTokens._id, "tokens.token": req.params.TOKEN },
                { $set: { "tokens.$.dateEnd": tokenObject.dateEnd } }
              );
            } else {
              throw new Error("Token no encontrado");
            }
          } else {
            throw new Error("Usuario no encontrado o inactivo");
        }
        res.status(200).send('Usuario verificado con éxito')
    } catch (error) {
        res.status(400).send({ error: error.message })
    }
}
