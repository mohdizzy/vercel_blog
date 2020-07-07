import matter from 'gray-matter'


var AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId:process.env.accessKeyId,
  secretAccessKey:process.env.secretAccessKey,
  region:"us-east-1"
});
var s3 = new AWS.S3({apiVersion: '2012-08-10'});

export async function getPostSlugs() {
  let filenames = [];
  try {
    let params = {
    Bucket: "mohd-thumb", 
   };
    const s3_keys = await s3.listObjectsV2(params).promise();
    s3_keys.Contents.map((item) => {
      if(item.Key.endsWith(".md")){
        filenames.push(item.Key)
      }
    });
    return filenames;
  }catch (e){
    console.log(e);
    throw new Error(e);
  }
  
}

export async function getPostBySlug(slug, fields = []) {
  const realSlug = slug.endsWith(".md") ? slug.replace(/\.md$/, '') : slug;
  let filecontent = {};

  try {
    let params = {
    Bucket: "mohd-thumb", 
    Key: slug.endsWith(".md") ? slug : slug + '.md'
   };
    let s3_data = await s3.getObject(params).promise();
    filecontent = s3_data.Body.toString('ascii')
    let { data, content } = matter(filecontent)

    let items = {}

    
    fields.forEach((field) => {
      if (field === 'slug') {
        items[field] = realSlug
      }
      if (field === 'content') {
        items[field] = content
      }

      if (data[field]) {
        items[field] = data[field]
      }
    })
    
    return items
  }catch (e){
    console.log(e);
    throw new Error(e);
  }

  
}

export async function getAllPosts(fields = []) {
  const slugs = await getPostSlugs();

  let arrayPromise = [];
  let posts = slugs.map((slug) => {
    arrayPromise.push(getPostBySlug(slug,fields)) 
  })
  let post = await Promise.all(arrayPromise);
  post = post.sort((post1,post2) => (post1.date > post2.date ? '-1' : '1'));
    
  return post
}
