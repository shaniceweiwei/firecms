import React from "react";
import { Box, Button, Container, Grid, Tab, Tabs } from "@material-ui/core";
import { Entity, EntityCollectionView, EntitySchema } from "../models";
import CollectionTable from "./CollectionTable";
import { Link as ReactLink } from "react-router-dom";
import { getRouterNewEntityPath } from "../routes/navigation";
import DeleteEntityDialog from "./DeleteEntityDialog";


interface SubCollectionViewProps<S extends EntitySchema> {

    parentCollectionPath: string;
    subcollections: EntityCollectionView<any>[];
    entity?: Entity<S>;

    onEntityClick?(collectionPath: string, entity: Entity<any>): void;
}

export default function SubCollectionsView<S extends EntitySchema>(
    {
        parentCollectionPath,
        subcollections,
        entity,
        onEntityClick
    }: SubCollectionViewProps<S>) {

    if (!subcollections) {
        throw Error("Subcollection view must use a schema with subcollection entries");
    }

    const firstSubcollection = Object.values(subcollections)[0];
    const [selectedView, setSelectedView] = React.useState<EntityCollectionView<any>>(firstSubcollection);

    function _onViewClicked(view: EntityCollectionView<any>) {
        setSelectedView(view);
    }

    let subcollectionPath: string | undefined = undefined;
    if (entity)
        subcollectionPath = `${parentCollectionPath}/${entity.id}/${selectedView.relativePath}`;

    return (
        <React.Fragment>

            <Container maxWidth={"md"}>
                <Grid
                    container
                    direction="row"
                    justify="space-between"
                    alignItems="flex-end"
                >
                    <Tabs value={selectedView}
                          onChange={(e, value) => _onViewClicked(value)}>
                        {Object.entries(subcollections).map(([key, view]) => (
                            <Tab label={view.name} value={view}
                                 key={`wrapped-tab-${key}`}/>
                        ))}
                    </Tabs>
                    <Box my={2} textAlign="right">
                        {subcollectionPath && <Button
                            component={ReactLink}
                            to={getRouterNewEntityPath(subcollectionPath)}
                            size="medium"
                            variant="outlined"
                            color="primary"
                        >
                            Add {selectedView.schema.name}
                        </Button>}
                    </Box>
                </Grid>
            </Container>

            {Object.entries(subcollections).map(([key, view]) => (
                <TabPanel key={`wrapped-tab-content-${key}`}
                          small={view.small === undefined ? false : view.small}
                          selectedView={selectedView}
                          thisView={view}
                          onEntityClick={onEntityClick}
                          subcollectionPath={subcollectionPath}/>
            ))}

        </React.Fragment>
    );
}


interface TabPanelProps<S extends EntitySchema> {
    subcollectionPath: string | undefined;
    small: boolean;
    thisView: EntityCollectionView<S>;
    selectedView: EntityCollectionView<S>;

    onEntityClick?(collectionPath: string, entity: Entity<S>): void;
}

function TabPanel<S extends EntitySchema>({ subcollectionPath, selectedView, thisView, onEntityClick, small, ...props }: TabPanelProps<S>) {

    const [deleteEntityClicked, setDeleteEntityClicked] = React.useState<Entity<S> | undefined>(undefined);

    const onEntityDelete = (collectionPath: string, entity: Entity<S>) => {
        setDeleteEntityClicked(entity);
    };

    const deleteEnabled = thisView.deleteEnabled === undefined || thisView.deleteEnabled;

    return <Grid
        hidden={selectedView !== thisView}>

        {subcollectionPath ?
            <CollectionTable collectionPath={subcollectionPath}
                             onEntityDelete={deleteEnabled ? onEntityDelete : undefined}
                             schema={thisView.schema}
                             onEntityEdit={onEntityClick}
                             includeToolbar={false}
                             paginationEnabled={false}
                             small={small}
                             additionalColumns={thisView.additionalColumns}
            />
            :
            <Grid container>
                <Box m={3}>You need to save your entity before adding additional
                    collections</Box>
            </Grid>}

        <DeleteEntityDialog entity={deleteEntityClicked}
                            schema={thisView.schema}
                            open={!!deleteEntityClicked}
                            onClose={() => setDeleteEntityClicked(undefined)}/>
    </Grid>;
}
