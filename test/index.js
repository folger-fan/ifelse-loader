/**
 * Created by folgerfan on 2017/7/18.
 */
///#if node
console.log('if node 1');
///#endif

///#if !node
console.log('if not node ');
///#else
console.log('else not node');
///#endif



///#if node
console.log('if node 2');
///#else
///#code console.log('else node 2')
///#endif


///#if !node
///#code console.log('if not node ');
///#else
///#code console.log('else not node');
///#endif